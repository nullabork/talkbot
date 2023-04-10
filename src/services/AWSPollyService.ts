import { Polly, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { MemberSettingsDBInterface } from '@Database/DatabaseInterfaces';
import { mp3ToOpus } from '@Util/ffmpeg';
import { Readable } from 'stream';
import { AudioServiceInterface } from '@Services/AudioServiceInterface';
   

/**
 * @class AWSPollyService
 * @description This class is responsible for handling all the AWS Polly related operations.
 * @example AWSPollyService.getAudio(AWSPollyService.buildXMLRequest('Text', memberSettings), 'opus');
 */
class AWSPollyService implements AudioServiceInterface {
    /**
     * @static
     * @method buildXMLRequest
     * @description This method is responsible for transforming the incoming text to a form that aws polly can handle
     * @param {string} text - The text to be converted to audio.
     * @param {MemberSettingsDBInterface} memberSettings - The member settings.
     * @returns {string} - output string
     * @example AWSPollyService.tranformInputText('Text', memberSettings);
    */
    async tranformInputText(text: string, memberSettings: MemberSettingsDBInterface): Promise<string> {
        //convert text into ssml you can find ssml tags here https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html
        return `
        <speak>
            <prosody rate="${memberSettings.speed}" pitch="${memberSettings.pitch}" volume="${memberSettings.volume}">
                ${text}
            </prosody>
        </speak>
        `;
    }

    /**
     * @static
     * @method getAudio
     * @description This method is responsible for converting the text to audio.
     * @param {string} text - The text to be converted to audio.
     * @param {string} format - The format of the audio to be converted to.
     * @returns {Promise<string>} - The audio file in base64 format.
     */
    async getAudio(text: string, memberSettings: MemberSettingsDBInterface): Promise<Readable> {
        const polly = new Polly({ 
            region: 'us-east-1',  
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID,
                secretAccessKey: process.env.SECRET_ACCESS_KEY,
            },
        });
        const command = new SynthesizeSpeechCommand({
            OutputFormat: 'mp3',
            Text: text,
            TextType: 'ssml',
            VoiceId: memberSettings.voice,
        });
        const {AudioStream} = await polly.send(command);
    
        return await mp3ToOpus(AudioStream as Readable);      
    }
}

export default AWSPollyService;