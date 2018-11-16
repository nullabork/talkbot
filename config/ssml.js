var SSMLTag = require('@models/SSMLTag');

module.exports = [
  /*********************
   *     emphasis
   *********************/
  new SSMLTag({
    open: '***',
    close: '***',

    type: 'emphasis',
    attributes: {
      level: "strong",
      volume: "+6dB"
    }
  })
  , new SSMLTag({
    open: '**',
    close: '**',

    type: 'emphasis',
    attributes: {
      level: "moderate",
    }
  })
  ,
  new SSMLTag({
    open: '*',
    close: '*',

    type: 'emphasis',
    attributes: {
      level: "low",
    }
  })
  ,
  /*********************
   *   negative pitch
   *********************/
  new SSMLTag({
    open: '----',
    close: '----',

    type: 'prosody',
    attributes: {
      pitch: "-100%",
      rate: "slow"
    }
  })
  ,
  new SSMLTag({
    open: '---',
    close: '---',

    type: 'prosody',
    attributes: {
      pitch: "-100%",
    }
  })
  ,
  new SSMLTag({
    open: '--',
    close: '--',

    type: 'prosody',
    attributes: {
      pitch: "-50%",
    }
  })
  ,
  /*********************
   *   positive pitch
   *********************/
  new SSMLTag({
    open: '+++',
    close: '+++',

    type: 'prosody',
    attributes: {
      pitch: "+100%"
    }
  })
  ,
  new SSMLTag({
    open: '++',
    close: '++',

    type: 'prosody',
    attributes: {
      pitch: "+100%"
    }
  })
  ,
  /*********************
   *   rate
   *********************/
  new SSMLTag({
    open: '#-',
    close: '-#',

    type: 'prosody',
    attributes: {
      rate: "slow"
    }
  })
  ,
  new SSMLTag({
    open: '#+',
    close: '+#',

    type: 'prosody',
    attributes: {
      rate: "fast"
    }
  })
];
