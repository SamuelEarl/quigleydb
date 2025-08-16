# NOTES

These notes are taken from this page (6 Aug 2025): https://docs.modular.com/mojo/manual/get-started.

Mojo is still evolving, so these instructions could change frequently.

## Check the pixi CLI version that is installed on your system

```
pixi --version
```

## Scaffold a new project

To create a new project named `life`, navigate to the directory in which you want to create the project and execute the following command:

```
pixi init life \
-c https://conda.modular.com/max-nightly/ -c conda-forge \
&& cd life
```

This creates a project directory named `life`, adds the Modular conda package channel, and enters the directory.


## Install Mojo

Install the Modular Platform from the modular package (which includes Mojo):

```
pixi add modular
```

This will add a `.pixi` subdirectory containing the conda virtual environment for the project.

## Check the Mojo version that is installed inside your virtual environment

`cd` into your project directory and run the following command, which will check the version of Mojo that's installed within your project's virtual environment. `pixi run` executes a command in the project's virtual environment, so you can use it to execute `mojo --version`:

```
pixi run mojo --version
```

You should see a version string indicating the version of Mojo installed, which by default should be the latest version.

## Activate/deactivate a virtual environment

### Activate

From the project root directory, run `pixi shell`. This will activate the virtual environment and start a shell session in your project's virtual environment.

If you are using VS Code then you will know when your project's virtual environment is active because in the Integrated Terminal pane, the "Terminal Shell" label (to the left of the "New Terminal" button) will change from `zsh` to `pixi`.

NOTE: If you are in a subdirect instead of your project's root directory, then it will show `zsh - <subdirectory>` and `pixi - <subdirectory>`.

### Deactivate

From the project root directory, run `exit`. This will exit the virtual environment.

If you are using VS Code then you will know when your project's virtual environment has been deactivated because in the Integrated Terminal pane, the "Terminal Shell" label (to the left of the "New Terminal" button) will change back to `zsh - <project directory>`.

### NOTE: How to display the active pixi environment in the terminal prompt

I am trying to find out how to display the active pixi environment in my terminal prompt, but I haven't been able to figure it out yet. In addition to the tips above, just understand this: When you want to run a `mojo` command, you have to be inside an active virtual environment where mojo is installed. If you are not in an active virt env when you run a `mojo` command, then you will get this error: `zsh: command not found: mojo`. That will let you know that you need to run `pixi shell` to start a shell session in your project's virtual environment.

## Run a program

With the virtual environment active, the `mojo` command will be available.

Run `mojo <name-of-file>.mojo`

## Compile a program and run it

With the virtual environment active, run `mojo build <name-of-file>.mojo`.

You will see an executable file in the current directory named `<name-of-file>`.

Run the executable: `./<name-of-file>`
