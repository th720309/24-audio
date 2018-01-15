import Encoder from './encoder';

class MicRecorder {
  constructor(config) {
    this.config = {
      // 128 or 160 kbit/s – mid-range bitrate quality
      bitRate: 128,

      // There is a known issue with some macOS machines, where the recording
      // will sometimes have a loud 'pop' or 'pop-click' sound. This flag
      // prevents getting audio from the microphone a few milliseconds after
      // the begining of the recording. It also helps to remove the mouse
      // "click" sound from the output mp3 file.
      startRecordingAt: 300
    };

    this.activeStream = null;
    this.context = null;
    this.microphone = null;
    this.processor = null;
    this.startTime = 0;

    Object.assign(this.config, config);
  }

  /**
   * Starts to listen for the microphone sound
   * @param {MediaStream} stream
   */
  addMicrophoneListener(stream) {
    this.activeStream = stream;

    // This prevents the weird noise once you start listening to the microphone
    this.timerToStart = setTimeout(() => {
      delete this.timerToStart;
    }, this.config.startRecordingAt);

    // Set up Web Audio API to process data from the media stream (microphone).
    this.microphone = this.context.createMediaStreamSource(stream);

    // Settings a bufferSize of 0 instructs the browser to choose the best bufferSize
    this.processor = this.context.createScriptProcessor(0, 1, 1);

    // Add all buffers from LAME into an array.
    this.processor.onaudioprocess = (event) => {
      if (this.timerToStart) {
        return;
      }

      // Send microphone data to LAME for MP3 encoding while recording.
      this.lameEncoder.encode(event.inputBuffer.getChannelData(0));
    };

    // Begin retrieving microphone data.
    this.microphone.connect(this.processor);
    this.processor.connect(this.context.destination);
  };

  /**
   * Disconnect microphone, processor and remove activeStream
   */
  stop() {
    if (this.processor && this.microphone) {
      // Clean up the Web Audio API resources.
      this.microphone.disconnect();
      this.processor.disconnect();

      // If all references using this.context are destroyed, context is closed
      // automatically. DOMException is fired when trying to close again
      if (this.context && this.context.state !== 'closed') {
        this.context.close();
      }

      this.processor.onaudioprocess = null;

      // Stop all audio tracks. Also, removes recording icon from chrome tab
      this.activeStream.getAudioTracks().forEach(track => track.stop());
    }

    return this;
  };

  /**
   * Requests access to the microphone and start recording
   * @return Promise
   */
  start() {
    //this.context = new AudioContext();
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.config.sampleRate = this.context.sampleRate;
    this.lameEncoder = new Encoder(this.config);

    //navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.MediaDevices.getUserMedia();
    var promisifiedOldGUM = function(constraints) {

      // First get ahold of getUserMedia, if present
      var getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia);

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if(!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });

    }

    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if(navigator.mediaDevices === undefined) {
      navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if(navigator.mediaDevices.getUserMedia === undefined) {
      navigator.mediaDevices.getUserMedia = promisifiedOldGUM;
    }

    return new Promise(function (resolve, reject) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        _this2.addMicrophoneListener(stream);
        resolve(stream);
      }).catch(function (err) {
        reject(err);
      });
    });
  };

  /**
   * Return Mp3 Buffer and Blob with type mp3
   * @return {Promise}
   */
  getMp3() {
    const finalBuffer = this.lameEncoder.finish();

    return new Promise((resolve, reject) => {
      if (finalBuffer.length === 0) {
        reject(new Error('No buffer to send'));
      } else {
        resolve([finalBuffer, new Blob(finalBuffer, { type: 'audio/mp3' })]);
        this.lameEncoder.clearBuffer();
      }
    });
  };
};

export default MicRecorder;
