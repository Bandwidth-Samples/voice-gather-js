import { CallsApi, Configuration, Bxml } from 'bandwidth-sdk';
import express from 'express';

const BW_ACCOUNT_ID = process.env.BW_ACCOUNT_ID;
const BW_CLIENT_ID = process.env.BW_CLIENT_ID;
const BW_CLIENT_SECRET = process.env.BW_CLIENT_SECRET;
const BW_VOICE_APPLICATION_ID = process.env.BW_VOICE_APPLICATION_ID;
const BW_NUMBER = process.env.BW_NUMBER;
const BASE_CALLBACK_URL = process.env.BASE_CALLBACK_URL;
const LOCAL_PORT = process.env.LOCAL_PORT;

if([
    BW_ACCOUNT_ID,
    BW_CLIENT_ID,
    BW_CLIENT_SECRET,
    BW_VOICE_APPLICATION_ID,
    BW_NUMBER,
    BASE_CALLBACK_URL,
    LOCAL_PORT
].some(item => item === undefined) || !Number.isInteger(Number(LOCAL_PORT))) {
    throw new Error('Please set the environment variables defined in the README');
}

const config = new Configuration({
    clientId: BW_CLIENT_ID,
    clientSecret: BW_CLIENT_SECRET
});

const app = express();
app.use(express.json());

app.post('/calls', async (req, res) => {
    if (typeof req.body?.to !== 'string') {
        return res.sendStatus(400);
    }

    const body = {
        applicationId: BW_VOICE_APPLICATION_ID,
        to: req.body.to,
        from: BW_NUMBER,
        answerUrl: `${BASE_CALLBACK_URL}/callbacks/outbound/voice`,
    };

    try {
        const callsApi = new CallsApi(config);
        await callsApi.createCall(BW_ACCOUNT_ID, body);
    } catch (err) {
        console.error('Failed to create call:', err.message);
        return res.sendStatus(500);
    }

    res.sendStatus(204);
});

app.post('/callbacks/outbound/voice', async (req, res) => {
    const callback = req.body;
    if (typeof callback !== 'object' || callback === null) {
        return res.sendStatus(400);
    }

    const response = new Bxml.Response();

    switch (callback.eventType) {
        case 'answer': {
            const speakSentence = new Bxml.SpeakSentence('Press 1 to choose option 1. Press 2 to choose option 2. Press pound when you are finished.');
            const gather = new Bxml.Gather({
                gatherUrl: '/callbacks/outbound/voice/gather',
                terminatingDigits: '#'
            }, speakSentence);

            response.addVerbs(gather);
            break;
        }
        case 'initiate': {
            const speakSentence = new Bxml.SpeakSentence('Initiate event received but not intended. Ending call.');
            const hangup = new Bxml.Hangup();

            response.addVerbs([speakSentence, hangup]);
            break;
        }
        case 'disconnect':
            console.log(`Call ${callback.callId} has disconnected`);
            break;
        default:
            console.log(`Unexpected event type ${callback.eventType} received`);
            break;
    }

    res.set('Content-Type', 'application/xml');
    res.status(200).send(response.toBxml());
});

app.post('/callbacks/outbound/voice/gather', async (req, res) => {
    const callback = req.body;
    if (callback?.eventType !== 'gather') {
        return res.sendStatus(400);
    }

    let speakSentence;
    if (callback.digits === '1') {
        speakSentence = new Bxml.SpeakSentence('You chose option 1. Goodbye.');
    } else if (callback.digits === '2') {
        speakSentence = new Bxml.SpeakSentence('You chose option 2. Goodbye.');
    } else {
        speakSentence = new Bxml.SpeakSentence('You did not choose a valid option. Goodbye.');
    }

    const response = new Bxml.Response([speakSentence]);

    res.set('Content-Type', 'application/xml');
    res.status(200).send(response.toBxml());
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.sendStatus(400);
    }
    next(err);
});

app.listen(LOCAL_PORT);
