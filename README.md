# Code Sample Browser for Intel Software Developer Tools

The Code Sample Browser extension for Visual Studio Code (VS Code) helps you
discover and create projects
that illustrate how to implement algorithms and applications with the oneAPI
collection of compilers, libraries and tools. Samples are written in C/C++,
Fortran and Python.

Use this extension to find samples that will help you:

* Apply the [DPC++ language extensions][dpcpp] to your applications and enable
  the use of CPUs, GPUs, and FPGAs for accelerated application performance.

[dpcpp]: <https://oneapi-spec.uxlfoundation.org/specifications/oneapi/v1.3-rev-1/elements/sycl/source/>

* Learn how to use the Intel performance libraries to enable your applications
  with faster threading, matrix arithmetic, machine learning, and other tasks.

* See the performance improvements possible with the Intel® Distribution for
  Python\*, especially for numeric, scientific, and High-Performance Computing
  (HPC) applications.

* Debug multi-threaded CPU and GPU applications using the Intel® Distribution
  for GDB\* (gdb-oneapi).

* Analyze performance bottlenecks in multi-threaded CPU, GPU, and FPGA
  applications using the Intel® VTune&trade; Profiler and
  Intel® Advisor analysis tools.

> NOTE: as shown in the image below, you can use the `+` hover icon to create
> a new project based on the selected sample.

![Gif of the extension in action](demo.gif)


## Where this Extension Works

This extension works on local and remote Linux\*, Windows\*, WSL\* and macOS\*
development systems. You can browse samples and create projects even if you
have not installed any Intel oneAPI development tools. Obviously, in order to
build and run these sample projects you will need to install those Intel
oneAPI tools that are required by the sample.

> Every sample includes a README.md file with details regarding the tools
> and hardware needed to compile and run that sample application.

The samples presented by this samples browser are also available in the
[oneAPI-samples repo](https://github.com/oneapi-src/oneAPI-samples) on GitHub.

We recommend that you also install these VS Code extensions:

* [Extension Pack for Intel Software Developer Tools][pack]
* [Microsoft Remote-Development Extension Pack][remote]
* [Microsoft C/C++ for Visual Studio Code][cpp]

[pack]: <https://marketplace.visualstudio.com/items?itemName=intel-corporation.oneapi-extension-pack>
[remote]: <https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack>
[cpp]: <https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools>

## Video Demo of this Extension

[Exploring oneAPI Samples with the Sample Browser in Visual Studio Code](https://youtu.be/hdpcNBB2aEU)


## Where to Find the Intel oneAPI Toolkits

This extension does not include any of the tools that are required to
compile, run, and debug a sample. For information on the various oneAPI
Toolkits visit:

* https://www.intel.com/content/www/us/en/developer/tools/oneapi/overview.html

For information on how to use VS Code with Intel oneAPI toolkits read
[Using Visual Studio Code\* to Develop Intel® oneAPI Applications][oneapi-toolkits].

[oneapi-toolkits]: <https://www.intel.com/content/www/us/en/develop/documentation/using-vs-code-with-intel-oneapi/top.html>


## Contributing to this Extension

Install a recent version of Visual Studio Code and open this project within
it. You may also need to install `node + npm`.

```bash
npm i
code .
```

At this point you should be able to run the extension in the "Extension
Development Host."


## License

This extension is released under the MIT open-source license.
