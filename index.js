import { CallsApi, Configuration, Bxml } from 'bandwidth-sdk';
import express from 'express';

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_VOICE_APPLICATION_ID = process.env.BW_VOICE_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const BW_USERNAME = process.env.BW_USERNAME;
const BW_PASSWORD = process.env.BW_PASSWORD;
const LOCAL_PORT = process.env.LOCAL_PORT;
const BASE_CALLBACK_URL = process.env.BASE_CALLBACK_URL;

if([
    BW_ACCOUNT_ID,
    BW_VOICE_APPLICATION_ID,
    BW_NUMBER,
    BW_USERNAME,
    BW_PASSWORD,
    LOCAL_PORT,
    BASE_CALLBACK_URL
].some(item => item === undefined)) {
    throw new Error('Please set the environment variables defined in the README');
}

const config = new Configuration({
    username: BW_USERNAME,
    password: BW_PASSWORD
});

const app = express();
app.use(express.json());

app.post('/calls', async (req, res) => {
    const body = {
        applicationId: BW_VOICE_APPLICATION_ID,
        to: req.body.to,
        from: BW_NUMBER,
        answerUrl: `${BASE_CALLBACK_URL}/callbacks/outbound/voice`,
    };

    const callsApi = new CallsApi(config);
    await callsApi.createCall(BW_ACCOUNT_ID, body);

    res.sendStatus(200);
})

app.post('/callbacks/outbound/voice', async (req, res) => {
    const callback = req.body;

    const response = new Bxml.Response();
    
    switch (callback.eventType) {
        case 'answer':
            const speakSentenceAnswer = new Bxml.SpeakSentence('Press 1 to choose option 1. Press 2 to choose option 2. Press pound when you are finished.');
            const gather = new Bxml.Gather({
                gatherUrl: `${BASE_CALLBACK_URL}/callbacks/outbound/gather`,
                terminatingDigits: '#'
            }, speakSentenceAnswer);

            response.addVerbs(gather);
            break;
        case 'initiate':
            const speakSentenceInitiate = new Bxml.SpeakSentence('Initiate event received but not intended. Ending call.');
            const hangup = new Bxml.Hangup();

            response.addVerbs([speakSentenceInitiate, hangup]);
            break;
        case 'disconnect':
            console.log('The Disconnect event is fired when a call ends, for any reason.');
            console.log(`Call ${callback.getCallId} has disconnected`);
            break;
        default:
            console.log(`Unexpected event type ${callback.eventType} received`);
            break;
    }

    res.status(200).send(response.toBxml());
})

app.post('/callbacks/outbound/gather', async (req, res) => {
    const callback = req.body;

    const response = new Bxml.Response();

    if (callback.eventType == 'gather') {
        const digits = callback.digits;

        let speakSentence;
        if (digits === '1') {
            speakSentence = new Bxml.SpeakSentence('You have chosen option 1. Goodbye');
        } else if (digits === '2') {
            speakSentence = new Bxml.SpeakSentence('You have chosen option 2. Goodbye');
        } else {
            speakSentence = new Bxml.SpeakSentence('You did not choose a valid option. Goodbye');
        }

        response.addVerbs(speakSentence);
    }

    res.status(200).send(response.toBxml());
})

app.listen(LOCAL_PORT);
