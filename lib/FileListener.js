const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

class FileListener extends EventEmitter {
    constructor(options) {
        super();
        this._setOptions(options);
    }

    async listen(callback) {
        this._logInfo('Start listening for files at ' + this.directory);
        await this._readDirectory((err) => {
            if (err) {
                callback(err);
                this._logError(err.message);
            }
        });

        if (this.interval > 0) {
            this.timer = setInterval(async () => {
                await this._readDirectory((err) => {
                    callback(err);
                    this._logError(err.message);
                });
            }, this.interval);
        }
    }

    stop() {
        clearInterval(this.timer);
        this._logInfo('Listener stopped');
    }

    async _readDirectory(callback) {
        await fs.stat(this.directory, async (err, stats) => {
            if (err) {
                callback(err);
                this._logError(err.message);
            }
            else {
                if (stats.isDirectory) {
                    await fs.readdir(this.directory, async (err, files) => {
                        if (err) {
                            callback(err);
                            this._logError(err.message);
                        }
                        else {
                            if (files) {
                                await this._getFiles(files.filter(fn => fn.endsWith(this.fileext)), (err) => {
                                    callback(err);
                                    this._logError(err.message);
                                });
                            }
                        }
                    });
                }
                else {
                    const err = Error(this.directory + ' is not a directory.');
                    callback(err);
                    this._logError(err.message);
                }
            }
        });
    }

    async _logInfo(event, level) {
        this.emit('log', { entry: event, level: 'info', timestamp: Date.now() });
    }

    async _logError(event, level) {
        this.emit('log', { entry: event, level: 'error', timestamp: Date.now() });
    }

    async _getFiles(files, callback) {
        let filesfound = [];
        for (let x = 0; x < files.length; x++) {
            const fileName = files[x];
            let fileType = fileName.match(this.typematch);
            let timeStamp = Date.now();
            fileType = (fileType) ? fileType[0] : '';
            let renameFile;
            if (this.mustrename) {
                const filePath = path.join(this.directory, fileName);
                renameFile = this.renametemplate
                    .replace('[TYPE]', fileType)
                    .replace('[TIMESTAMP]', timeStamp)
                    .replace('[COUNTER]', x);
                const reNamePath = path.join(this.directory, renameFile);
                await this._renameFile(filePath, reNamePath, async (err) => {
                    if (!err) {
                        if (this.mustbackup) {
                            await this._backupFile(renameFile);
                        }
                    }
                    else {
                        callback(err);
                        this._logError(err.message);
                    }
                });
            }
            else {
                if (this.mustbackup) {
                    await this._backupFile(fileName, (err) => {
                        callback(err);
                        this._logError(err.message);
                    });
                }
            }

            filesfound.push({
                original: fileName,
                renamed: renameFile,
                timestamp: timeStamp,
                counter: x,
                type: fileType
            });
        }

        if (filesfound.length > 0) {
            this.emit('loaded', filesfound);
        }
    }

    async _renameFile(fromFile, toFile, callback) {
        await fs.access(toFile, async (err) => {
            if (err) {
                await fs.rename(fromFile, toFile, (err) => {
                    if (err)
                        this._logInfo(`File busy/error: ${fromFile}`);
                    else
                        this._logInfo(`File renamed: ${toFile}`);
                    callback(err, toFile);
                });
            }
            else {
                this._logInfo('File busy/error, ' + toFile);
                callback(err, toFile);
            }
        });
    }

    async _backupFile(fileName, callback) {
        const from = path.join(this.directory, fileName);
        const to = path.join(this.backupdirectory, fileName);

        await fs.access(from, async (err) => {
            if (!err) {
                await fs.access(this.backupdirectory, async (err) => {
                    if (err)
                        fs.mkdirSync(this.backupdirectory);

                    await fs.copyFile(from, to, (err) => {
                        if (err)
                            callback(err);
                        else
                            this._logInfo('File backup: ' + fileName);
                    });
                })

            }
            else {
                callback(err);
            }
        });
    }

    async readFile(fileName) {
        await fs.readFile(path.join(this.directory, fileName), 'utf8', (err, data) => {
            if (!err) {
                console.log(data);
            }
            else
                console.log(err);
        });
    }

    _setOptions(options) {
        function _optionsMessage(param, env) {
            return `${param} not set, options.${param.toLowerCase()} or environment variable ${env}`;
        }

        if (options) {
            if (options.directory) this.directory = path.normalize(options.directory);
            if (options.interval) this.interval = options.interval;
            if (options.fileext) this.fileext = options.fileext;
            if (options.typematch) this.typematch = options.typematch;
            if (options.mustrename) this.mustrename = options.mustrename;
            if (options.renametemplate) this.renametemplate = options.renametemplate;
            if (options.mustbackup) this.mustrename = options.mustbackup;
            if (options.backupdirectory) this.backupdirectory = options.backupdirectory;
        }

        this.directory = (this.directory) ? this.directory : path.normalize(process.env.FILELOADER_DIRECTORY);
        this.interval = (this.interval) ? this.interval : process.env.FILELOADER_INTERVAL;
        this.fileext = (this.fileext) ? this.fileext : process.env.FILELOADER_EXT;
        this.typematch = (this.typematch) ? this.typematch : process.env.FILELOADER_TYPEMATCH;
        this.mustrename = (this.mustrename) ? this.mustrename : process.env.FILELOADER_MUSTRENAME;
        this.renametemplate = (this.renametemplate) ? this.renametemplate : process.env.FILELOADER_RENAMETEMPLATE;
        this.mustbackup = (this.mustbackup) ? this.mustbackup : process.env.FILELOADER_MUSTBACKUP;
        this.backupdirectory = (this.backupdirectory) ? this.backupdirectory : process.env.FILELOADER_BACKUPDIRECTORY;

        if (!this.directory) throw new Error(_optionsMessage('Directory', 'FILELOADER_DIRECTORY'));
        if (!this.fileext) throw new Error(_optionsMessage('FileExt', 'FILELOADER_EXT'));
        if (!this.interval) this.interval = 0;
        if (!this.typematch) this.typematch = /[^\-]*/;
        if (!this.mustrename) this.mustrename = true;
        if (!this.renametemplate) this.renametemplate = '[TYPE]-[TIMESTAMP]-[COUNTER].dat';
        if (!this.mustbackup) this.mustbackup = true;
        if (!this.backupdirectory) this.backupdirectory = path.join(this.directory, '_backup');
    }
}

module.exports = FileListener;
