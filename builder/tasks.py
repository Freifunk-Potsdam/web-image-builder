"""
Queue for the tasks to do.

"""
from .config import config, debug
import subprocess
import os
from queue import Queue
import threading
import traceback
import datetime
import tempfile
import json

class TaskQueue(threading.Thread):

    def __init__(self):
        """Create a task queue."""
        threading.Thread.__init__(self, daemon=True)
        self.tasks = []
        self.queue = Queue()
        self.start()
        
    def run(self):
        """Work on the tasks."""
        while True:
            task = self.queue.get()
            task.run_safely_in_queue()
    
    def add(self, task):
        """A task must be a Task."""
        self.queue.put(task)
        self.tasks.append(task)
        
    def toJSON(self):
        """Return a JSON representation of the tasks."""
        return {"tasks": [task.toJSON() for task in self.tasks]}

    def ahead(self):
        return self.queue.qsize()

class Task:
    """A task to work on."""
    
    def __init__(self, config_source=config):
        self.state = "waiting"
        self.created_at = self.now()
        self.started_at = None
        self.done_at = None
        self.config_source = config_source
        self.config = None
        
    def now(self):
        return datetime.datetime.now()
    
    def toJSON(self):
        return {
            "created_at": self.created_at,
            "started_at": self.started_at,
            "done_at": self.done_at,
            "state": self.state,
            "description": self.get_documentation(),
            "config": self.get_config().toJSON()
        }
        
    def get_documentation(self):
        return self.__doc__
        
    def run_safely_in_queue(self):
        try:
            self.state = "running"
            self.started_at = self.now()
            # defer the fixed config until the task is running
            # this way other tasks can be a configuration and change the
            # configuration
            self.config = self.config_source.get_config().clone()
            self.run()
            self.state = "done"
        except:
            traceback.print_exc()
            self.state = "error"
        self.done_at = self.now()

    def execute(self, *args, **kw):
        self.debug("execute:", *args, kw)
        subprocess.check_call(*args, **kw)
        
    def debug(self, *args):
        debug(*args)
        
    def get_config(self):
        """Return the configuration of the task."""
        if self.config is None:
            return self.config_source.get_config()
        return self.config
        
    def run(self):
        """Run the task."""


class SetupRepository(Task):
    """Setup the repository.
    
    This clones the repository and checks out the correct branch.
    """

    def run(self):
        """Clone and setup the repository."""
        if os.path.isdir(self.config.firmware.directory):
            self.execute(["rm", "-rf", self.config.firmware.directory])
        os.makedirs(self.config.firmware.directory)
        self.execute(["git", "clone", 
            "--branch", self.config.firmware.repository.branch, 
            "--depth", str(self.config.firmware.repository.depth),
            self.config.firmware.repository.git_url,
            self.config.firmware.directory])
        for file in self.config.files:
            assert any(file["path"].startswith(directory) for directory in self.config.allowed_directories), file["path"] + " should be one of " + ", ".join(self.config.allowed_directories)
            assert file["path"].startswith("/") and not ".." in file["path"]
            path = self.config.firmware.directory + file["path"]
            if "append" in file:
                with open(path, "a", encoding="UTF-8") as openFile:
                    openFile.write(file["append"])
            else: # content
                with open(path, "w", encoding="UTF-8") as openFile:
                    openFile.write(file["content"])


class Build(Task):
    """Build the firmware."""
    
    def run(self):
        try:
            self.execute(
                ["echo",
                 "make", "-j", str(self.config.cores),
                 "TARGET=" + self.config.build.target,
                 "PACKAGES_LIST_DEFAULT=" + " ".join(self.config.build.package_list)],
                cwd=self.config.firmware.directory)
        except:
            self.config.build.status = "failure"
        else:
            self.config.build.status = "success"

class SaveBuildResults(Task):
    """Save the build results so that they can be used later."""
    
    def run(self):
        self.target = self.config.results.target
        self.config.results.target = new_target = os.path.join(
            self.config.results.target, self.config.build.id)
        os.makedirs(new_target, exist_ok=True)
        os.makedirs(self.config.results.source, exist_ok=True)
        self.execute(["cp", "-rT", self.config.results.source, self.config.results.target])
        result = os.path.join(new_target, self.config.build.result);
        with open(result, "w", encoding="UTF-8") as file:
            json.dump(self.config.toJSON(), file)

class SendEmail(Task):
    """Send and e-mail to the builder that the task is done."""


if __name__ == "__main__":
    SetupRepository().run()
