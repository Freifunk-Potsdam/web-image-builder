'''Configuration of the builder.

This file loads the configuration from the config file,
the environment variables and the 
arguments.
'''
import os
import yaml
import pprint
import sys

HERE = os.path.dirname(__file__) or "."
CONFIG_PATH = os.path.join(HERE, "config.yml")

def set_value_from_key(key, value):
    config = CONFIG
    keys = key.split(".")
    for key in keys[:-1]:
        config = config[key]
    key = keys[-1]
    config[key] = yaml.safe_load(value)

CONFIG = yaml.safe_load(open(CONFIG_PATH))
for var, value in os.environ.items():
    if var.startswith(CONFIG["env_prefix"]):
        key = var[len(CONFIG["env_prefix"]):]
        set_value_from_key(key, value)

def debug(*args):
    if len(args) == 1:
        pprint.pprint(args[0])
    else:
        print(*args)

for arg in sys.argv[1:]:
    assert arg.startswith("--")
    key, value = arg[2:].split("=", 1)
    set_value_from_key(key, value)

debug(CONFIG)

class ConfigObject:
    """Allow accessing values as python objects."""
    
    def __init__(self, values, root=""):
        self.__root = root
        self.__values = values
        for key, value in values.items():
            setattr(self, key, value)
    
    def toJSON(self):
        result = {}
        for key in self.__values:
            value = getattr(self, key)
            if hasattr(value, "toJSON"):
                value = value.toJSON()
            result[key] = value
        return result
        
    def __setattr__(self, attr, value):
        if not attr.startswith("_"):
            if attr not in self.__values:
                raise AttributeError(attr + " is not allowed for " + (self.__root  or "config"))
            value = self._get_value(attr, value)
        self.__dict__[attr] = value
        
    def _get_value(self, attr, value):
        """Return the value possibly as a config object."""
        if isinstance(value, dict):
            return self.__class__(value, root = self.__root + "." + attr)
        return value
    
    def clone(self):
        return self.__class__(self.toJSON(), self.__root)
        
    def get_config(self):
        return self
        
    def get(self, key, default=None):
        """Return a configuration under the key."""
        return self._get_value(key, value)
        

config = ConfigObject(CONFIG)

__all__ = ["debug", CONFIG]

