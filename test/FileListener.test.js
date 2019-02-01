const FileListener = require('../lib/FileListener');

describe('listen', () => {
    it('should find a file', () => {
        const fileListener = new FileListener({
            directory: './dump',
            interval: 5000,
            fileext: '.csv',
            typematch: /[^\_]*/,
            renametemplate: '[TYPE]-[TIMESTAMP]-[COUNTER].dat'
        });

        fileListener.listen((err) => {

        });
    })
})