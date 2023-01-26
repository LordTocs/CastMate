const { SpeechEngine, AudioInput, SpeechRecognizer, CommandGrammar } = require('bindings')('ms-speech-native');
/*const { nextTick } = require('process')


const defaultEngine = SpeechEngine.getDefaultEngine();
const defaultInput = AudioInput.getDefaultInput();

console.log(defaultEngine.toString());
console.log(defaultInput.toString());

const recognizer = new SpeechRecognizer(defaultEngine, defaultInput);

recognizer.setRecognitionCallback((str) => {
    console.log("Recognized", str);
})

const grammar = new CommandGrammar(recognizer);




nextTick(() => { 

    grammar.setCommands([
        "hello stream",
        "big screen",
        "voice recognition"
    ])
    

    grammar.activate();

    
    recognizer.enableMicrophone();


}, 0)


//}, 0);

*/

module.exports = { SpeechEngine, AudioInput, SpeechRecognizer, CommandGrammar }




