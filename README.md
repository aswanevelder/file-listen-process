# file-listen-process

file-listen-process is a NodeJS library listen for files with a specific extension in a directory, rename and backup the file as it arrives. 

Example:

File arrive: STOCK.csv

File renamed: STOCK-1549004279028-0.dat

File backup: _backup/STOCK-1549004279028-0.dat

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install file-listen-process.

```bash
npm i file-listen-process
```

## Usage

```node
const flp = require('file-listen-process');

const listener = new flp.Listener({
    directory: './dump',
    interval: 5000,
    fileext: '.csv',
    typematch: /[^\_]*/,
    renametemplate: '[TYPE]-[TIMESTAMP]-[COUNTER].dat'
});

listener.listen((err) => {
    console.log(err.message);
});

listener.on('loaded', (files) => {
    console.log(files);
});

listener.on('log', (event) => {
    console.log(event);
});

```

## Listener Options

[option (environment variable)]

directory (FILELOADER_DIRECTORY)

interval (FILELOADER_INTERVAL) *** timer interval in seconds

fileext (FILELOADER_EXT) *** like .csv

typematch (FILELOADER_TYPEMATCH) *** regex match

mustrename (FILELOADER_MUSTRENAME) *** true/false to rename file

renametemplate (FILELOADER_RENAMETEMPLATE) *** [TYPE],[TIMESTAMP],[COUNTER]

mustbackup (FILELOADER_MUSTBACKUP) *** true/false to backup file

backupdirectory (FILELOADER_BACKUPDIRECTORY) *** directory for file backup

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)