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
            self.config.firmware.repository.git_url,
            self.config.firmware.directory])


class Build(Task):
    """Build the firmware."""
    
    def run(self):
        self.execute(
            ["make", "-j", str(self.config.cores)],
            cwd=self.config.firmware.directory)
        self.config.build_status = "success"

class SaveBuildResults(Task):
    """Save the build results so that they can be used later."""
    
    def run(self):
        self.target = self.config.results.target
        self.config.results.target = new_target = os.path.join(
            self.config.results.target, "build-" + self.config.build_id + "-" + self.config.get("build_status", "failed"))
        os.makedirs(new_target)
        self.execute(["cp", "-rT", self.config.results.source, self.config.results.target])

class SendEmail(Task):
    """Send and e-mail to the builder that the task is done."""


if __name__ == "__main__":
    SetupRepository().run()
