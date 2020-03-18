# Sample Browser for Intel oneAPI Toolkits

A simple extension for viewing code samples available for Intel oneAPI toolkits.
Leverages cross platform `oneapi-cli` to get the sample index and contents.

![Gif of the extension in action](demo.gif)

## Functionality

* View available samples from Intel oneAPI toolkits, and lets you download them.
* Check dependencies are installed for a sample.

## Where to find Intel oneAPI toolkits.

This extension does not provide any of the tools that may be required to compile/run the sample.

Please visit https://software.intel.com/en-us/oneapi for details.


## Contributing 
Install Visual Studio Code (at least version 1.42) and open this project within it.
You may also need `yarn` installed, and of course `node + npm`

```bash
npm install -g yarn
yarn install
code .
```

At this point you should be able to run the extension in the "Extension Development Host"

## License
This extension is released under MIT.
