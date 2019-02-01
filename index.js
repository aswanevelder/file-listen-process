const FileListener = require('./lib/FileListener');

const fileListener = new FileListener({
    directory: './dump',
    interval: 5000,
    fileext: '.csv',
    typematch: /[^\_]*/,
    renametemplate: '[TYPE]-[TIMESTAMP]-[COUNTER].dat'
});

fileListener.on('loaded', async (files) => {
    console.log(files);
});

fileListener.on('log', async (event) => {
    console.log(event.entry);
});

fileListener.listen((err) => {
    console.log(err.message);
});




