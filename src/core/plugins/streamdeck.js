const {openStreamDeck} = require('@elgato-stream-deck/node');

module.exports = {
  name: "streamdeck",
  uiName: "Elgato Stream Deck",
  icon: "mdi-apps",
  color: "#619DB7",
  async init() {
    const myStreamDeck = await openStreamDeck();

    if(myStreamDeck) {
      myStreamDeck.on('down', (keyIndex) => {
        this.triggers.pressButton({command: keyIndex})
        console.log('key %d down', keyIndex)
      })
      
      myStreamDeck.on('up', (keyIndex) => {
        console.log('key %d up', keyIndex)
      })
  
      myStreamDeck.on('error', (error) => {
        console.error(error)
      })
    } 
  },
  state: {},
  methods: {},
  triggers: {
    pressButton: {
      name: "Button Press",
      description: "Fires when a button is pressed on a stream deck. Assign stream deck buttons to automations by button number.",
      type: "CommandTrigger"
    }
  },
  // actions: {
  //   pressButton: {
  //     name: "Test Stream Deck",
  //     description: "Do stuff",
  //     icon: "mdi-apps",
	// 		color: "#5E5172",
  //     data: {
  //       type: String,
  //       template: true
  //     },
  //     async handler() {
  //       console.log("button pressed")
  //     }
  //   }
  // }
}