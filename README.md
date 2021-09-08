# Sample Browser for Intel oneAPI Toolkits

The Sample Browser extension helps you discover and create oneAPI projects
that illustrate how to implement algorithms and applications with the oneAPI
collection of compilers, libraries and other tools. Samples are written in
C/C++, Fortran and Python.

Use this extension to find samples that will help you:

* Apply the [DPC++ language extensions][dpcpp] to your applications and enable
  the use of CPUs, GPUs and FPGAs for accelerated application performance.

[dpcpp]: <https://spec.oneapi.io/versions/latest/elements/dpcpp/source/index.html>

* Learn how to use the Intel performance libraries to enable your applications
  with faster threading, matrix arithmetic, machine learning and other tasks.

* See the performance improvements possible by using the Intel Distribution of
  Python, especially for Numeric and Scientific developers and High-Performance
  Computing (HPC) applications.

* Debug multi-threaded and GPU enabled applications using the Intel Distribution
  of GDB (gdb-oneapi).

* Analyze performance bottlenecks in multi-threaded CPU, GPU and FPGA
  applications using the Intel VTune Profiler and Intel Advisor analysis tools.

This extension works on Linux, Windows and macOS local and remote development
systems. You can browse samples and create projects even if you have not
installed any Intel oneAPI development tools. Obviously, in order to compile
and run sample projects will require installation of those Intel oneAPI tools
that are required by the sample.

> Every sample includes a README.md file that includes details regarding what
> tools and hardware are required to compile and run the sample application.

We recommend that you also install the [Microsoft Remote-Development extension
pack][remote] and the [Environment Configurator for Intel oneAPI
Tooklits][env].

[remote]: <https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack>
[env]: <https://marketplace.visualstudio.com/items?itemName=intel-corporation.oneapi-environment-variables>


## What this extension does

* View and download samples from the Intel oneAPI samples repo.
* Check dependencies rules for each sample.

This extension provides a convenient way to scan and search the code samples
that are available for use with the Intel oneAPI toolkits. It leverages the
cross-platform `oneapi-cli` command-line sample browser to retrieve
information about each sample.

> NOTE: as shown in the image below, you can use the `+` hover icon to create
> a new project based on the selected sample.

![Gif of the extension in action](demo.gif)

> The samples that are presented by this samples browser are also available in
> the [oneAPI-samples repo](https://github.com/oneapi-src/oneAPI-samples) on
> GitHub.


## Video demo of this extension

[Exploring oneAPI Samples with the Sample Browser in Visual Studio Code](https://youtu.be/hdpcNBB2aEU)


## Where to find the Intel oneAPI toolkits

This extension does not include any of the tools that may be required to
compile, run and debug a sample. For information on the various oneAPI
Toolkits, visit:

* https://software.intel.com/en-us/oneapi

For information on how to use Visual Studio Code with Intel oneAPI toolkits
read [Using Visual Studio Code* to Develop Intel® oneAPI Applications][oneapi-toolkits].

[oneapi-toolkits]: <https://software.intel.com/content/www/us/en/develop/documentation/using-vs-code-with-intel-oneapi/top.html>


## Contributing to this extension

Install a recent version of Visual Studio Code and open this project within
it. You may also need to install `yarn` and, of course, `node + npm`.

```bash
npm install -g yarn
yarn install
code .
```

At this point you should be able to run the extension in the "Extension
Development Host"


## License

This extension is released under the MIT open-source license.
