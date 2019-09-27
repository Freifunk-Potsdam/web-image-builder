#!/usr/bin/python3
import sys
import json

input = sys.argv[1]
fields = sys.argv[2:]

with open(input, "rb") as file:
    lines = iter(file)
    first_line = next(lines)
    # parse comuln names
    names = first_line.decode("UTF-8").split("\t")
    message = " must be one of " + ", ".join(names)
    indices = []
    for field in fields:
        assert field in names, field + message
        index = names.index(field)
        indices.append(index)
    # fill the list of models
    models = []
    for line in lines:
        model = line.split(b"\t")
        model_fields = [model[index].decode("latin-1") for index in indices]
        models.append(model_fields)

print(json.dumps({
    "column_names": fields,
    "models": models
}))

