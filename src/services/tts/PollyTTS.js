/*jshint esversion: 9 */
const https = require("https"),
    querystring = require("querystring"),
    aws4 = require("aws4");

class PollyTTS {
  constructor(credentials) {
    this.credentials = credentials;
  }

  async describeVoices() {
    return new Promise((resolve, reject) => {

        let options = {};

        let opts = {
            service: "polly",
            region: options.region || "eu-west-1",
            path: "/v1/voices?",
            signQuery: true
        };

        // you can also pass AWS credentials in explicitly (otherwise taken from process.env)
        aws4.sign(opts, this.credentials);
        https.get(opts, res => {
            if (res.statusCode !== 200) {
                reject(`Request Failed. Status Code: ${res.statusCode}`);
            }
            else {
                let body = "";

                res.on("data", (chunk) => {
                    body += chunk;
                });
            
                res.on("end", () => {
                    try {
                        let json = JSON.parse(body);
                        resolve(json);
                        // do something with JSON
                    } catch (error) {
                        reject(error.message);
                    };
                });            
            }
        })
        .on("error", reject);
    })
  }

  async textToSpeech(options, callback) {

    return new Promise((resolve, reject) => {

        if (!options) {
            return reject("Options are missing");
        }
        let qs = {
            Text: options.text,
            TextType: options.textType || "text",
            VoiceId: options.voiceId || "Vicki",
            SampleRate: options.sampleRate || 22050,
            OutputFormat: options.outputFormat || "mp3"
        };
        let opts = {
            service: "polly",
            region: options.region || "eu-west-1",
            path: "/v1/speech?" + querystring.stringify(qs),
            signQuery: true
        };
      
        // you can also pass AWS credentials in explicitly (otherwise taken from process.env)
        aws4.sign(opts, this.credentials);
        https.get(opts, res => {
            if (res.statusCode !== 200) {
                throw new Error(`Request Failed. Status Code: ${res.statusCode}`)
            }
            resolve(res);
        })
        .on("error", e => {
            reject(e);
        });
    })
  }
}

module.exports = PollyTTS;
