# 24-audio

Record your microphone audio input and get an ```audio/mp3``` file in the end.

# Install

## npm

```bash
npm install 24-audio
```


# How to use

```js
const MicRecorder = require('24-audio');

// New instance
const recorder = new MicRecorder({
  bitRate: 128
});

// Start recording. Browser will request permission to use your microphone.
recorder.start().then(() => {
  // something else
}).catch((e) => {
  console.error(e);
});

// Once you are done singing your best song, stop and get the mp3.
recorder
.stop()
.getMp3().then(([buffer, blob]) => {
  // do what ever you want with buffer and blob
  // Example: Create a mp3 file and play
  const file = new File(buffer, 'me-at-thevoice.mp3', {
    type: blob.type,
    lastModified: Date.now()
  });

  const player = new Audio(URL.createObjectURL(file));
  player.play();

}).catch((e) => {
  alert('We could not retrieve your message');
  console.log(e);
});
```

- Check the [samples](https://github.com/closeio/mic-recorder-to-mp3/tree/master/samples) folder for more examples.

- [Live example on jsfiddle](https://jsfiddle.net/8u5fbpx6/1/)

## Lamejs Notice

This library uses lamejs as a direct dependency. We build our releases with [lamejs](https://github.com/zhuker/lamejs/) built-in, so you don't need to add another dependency.

Thanks to **@zhuker** for writing the lamejs library.
This project is a Supplementary to the **mic-recorder-to-mp3**.

# License

MIT
