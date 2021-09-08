import { Client, ApiController, Response, SpeakSentence, Gather } from '@bandwidth/voice';
import express from 'express';

const app = express();
app.use(express.json());

const accountId = process.env.BW_ACCOUNT_ID;
const applicationId = process.env.BW_VOICE_APPLICATION_ID;
const bwPhoneNumber = process.env.BW_NUMBER;
const port = process.env.LOCAL_PORT;
const baseUrl = process.env.BASE_CALLBACK_URL;
const username = process.env.BW_USERNAME;
const password = process.env.BW_PASSWORD;

if (!accountId || !applicationId || !bwPhoneNumber || !baseUrl) {
    throw new Error(`Enviroment variables not set up properly
    accountId: ${accountId}
    applicationId: ${applicationId}
    phone number: ${bwPhoneNumber}
    port: ${port}
    baseUrl: ${baseUrl}`);
}

if (!username){
    throw new Error(`Username: undefined`);
}

if (!password){
    throw new Error(`Password: undefined`);
}

console.log(`Enviroment variables set to:
    accountId: ${accountId}
    applicationId: ${applicationId}
    phone number: ${bwPhoneNumber}
    port: ${port}
    baseUrl: ${baseUrl}`);

// initialize the client 
const client = new Client({
    basicAuthPassword: password,
    basicAuthUserName: username
});

// The controller is the main API to the SDK
const controller = new ApiController(client)

app.post('/calls', async (req, res) => {

    const to = req.body.to;

    try {
        const response = await controller.createCall(accountId, {
            applicationId,
            from: bwPhoneNumber,
            to: to,
            answerUrl: `${baseUrl}/callbacks/outbound/voice`
        });
    } catch (e) {
        res.status(500).json({
            success: false,
            error: e.message
        });
        return
    }
    res.status(200).json({
        success: true
    });
})

app.post('/callbacks/outbound/voice', async (req, res) => {
    const callback = req.body;

    const response = new Response();
    
    switch (callback.eventType) {
        case 'answer':
            response.add(
                new Gather({
                    gatherUrl: '/callbacks/outbound/gather',
                    terminatingDigits: '#',
                    audioProducers:[
                        new SpeakSentence({
                            sentence: 'Text goes here hit pound when finished.'
                        })
                    ]
                })
            );
            break;
        case 'initiate':
            response.add(
                new SpeakSentence({
                    sentence: 'Initiate event recieved but not intended.  Ending call.'
                })
            );
            break;
        case 'disconnect':
            console.log('The Disconnect event is fired when a call ends, for any reason. The cause for a disconnect event on a call can be:');
            console.log(`Call ${callback.getCallId} has disconnected`);
            break;
        default:
            break;
    }

    res.status(200).send(response.toBxml());
})

app.post('/callbacks/outbound/gather', async (req, res) => {
    const callback = req.body;

    const response = new Response();

    switch (callback.eventType) {
        case 'gather':
            const digits = callback.digits.toLowerCase();

            let speakSentence = SpeakSentence;
            if (digits === '1') {
                speakSentence = new SpeakSentence({
                    sentence: 'You have chosen option 1.'
                });
            } else if (digits === '2') {
                speakSentence = new SpeakSentence({
                    sentence: 'You have chosen option 2.'
                });
            } else {
                speakSentence = new SpeakSentence({
                    sentence: 'Invalid choice.'
                });
            }

            response.add(speakSentence);

            break;
        default:
            break;
    }

    res.status(200).send(response.toBxml());
})



app.listen(port);