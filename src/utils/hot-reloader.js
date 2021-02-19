const YAML = require('yaml');
const fs = require("fs");

class HotReloader
{
	constructor(filename, onChange, onError)
	{
		if (!onChange)
			throw new Error("OnChange is required");

		this.filename = filename;
		this.onChange = onChange;
		this.onError = onError;

		this.data = this._load();
		this.watcher = fs.watchFile(this.filename, () => {
			try
			{
				const newData = this._load();
				onChange(newData, oldData);
				this.data = newData;
			}
			catch(err)
			{
				if (this.onError)
				{
					this.onError(err);
				}
			}
		});
	}

	_load()
	{
		return YAML.parse(fs.readFileSync(this.filename, 'utf-8'));
	}
}

module.exports = HotReloader;