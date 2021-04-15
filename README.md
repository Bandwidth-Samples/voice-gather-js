# Voice Gather Sample App
<a href="http://dev.bandwidth.com"><img src="https://s3.amazonaws.com/bwdemos/BW-VMP.png"/></a>
</div>

 # Table of Contents

<!-- TOC -->

- [Voice Gather Sample App](#voice-gather-sample-app)
- [Description](#description)
- [Bandwidth](#bandwidth)
- [Environmental Variables](#environmental-variables)
- [Callback URLs](#callback-urls)
    - [Ngrok](#ngrok)

<!-- /TOC -->

# Description
This sample app creates an outbound call to the Bandwidth Phone Number, and if answered will prompt the user using [Gather BXML](https://dev.bandwidth.com/voice/bxml/verbs/gather.html) to select between a list of options to hear different messages played back.

# Bandwidth

In order to use the Bandwidth API users need to set up the appropriate application at the [Bandwidth Dashboard](https://dashboard.bandwidth.com/) and create API tokens.

To create an application log into the [Bandwidth Dashboard](https://dashboard.bandwidth.com/) and navigate to the `Applications` tab.  Fill out the **New Application** form selecting the service (Messaging or Voice) that the application will be used for.  All Bandwidth services require publicly accessible Callback URLs, for more information on how to set one up see [Callback URLs](#callback-urls).

For more information about API credentials see [here](https://dev.bandwidth.com/guides/accountCredentials.html#top)

# Environmental Variables
The sample app uses the below environmental variables.
```java
BW_ACCOUNT_ID                 // Your Bandwidth Account Id
BW_USERNAME                   // Your Bandwidth API Token
BW_PASSWORD                   // Your Bandwidth API Secret
BW_PHONE_NUMBER               // Your The Bandwidth Phone Number
BW_VOICE_APPLICATION_ID       // Your Voice Application Id created in the dashboard
LOCAL_PORT                    // The port number you wish to run the sample on
```

# Callback URLs

For a detailed introduction to Bandwidth Callbacks see https://dev.bandwidth.com/guides/callbacks/callbacks.html

Below are the callback paths:
* `/calls`                     - POST to create a call to a phone number specified
* `/callbacks/voiceCallback`   - Bandwidth will POST a callback to this endpoint (setup in https://dashboard.bandwidth.com)
* `/callbacks/gatherCallback`  - Bandwidth will POST a callback here once the Gather has finished.

## Ngrok

A simple way to set up a local callback URL for testing is to use the free tool [ngrok](https://ngrok.com/).  
After you have downloaded and installed `ngrok` run the following command to open a public tunnel to your port (`$LOCAL_PORT`)
```cmd
ngrok http $LOCAL_PORT
```
You can view your public URL at `http://127.0.0.1:{LOCAL_PORT}` after ngrok is running.  You can also view the status of the tunnel and requests/responses here.
