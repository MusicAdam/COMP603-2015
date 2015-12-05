var gsfi = {};

function GSFIParseError(message) {
  this.name = 'GSFIParseError';
  this.message = message || 'There was a problem parsing GSFI.';
  this.stack = (new Error()).stack;
}
GSFIParseError.prototype = Object.create(Error.prototype);
GSFIParseError.prototype.constructor = GSFIParseError;

function GSFIArgumentError(message) {
  this.name = 'GSFIArgumentError';
  this.message = message || 'There was a problem parsing GSFI arguments.';
  this.stack = (new Error()).stack;
}
GSFIArgumentError.prototype = Object.create(Error.prototype);
GSFIArgumentError.prototype.constructor = GSFIArgumentError;

gsfi.shapes = {
  create: function(context, type, color){
    if(type == null)
      throw new GSFIArgumentError(context.line + ": shape type \"" + type + "\" is invalid");
    return {
      type: type,
      color: this.defaultColor(color),
      size: gsfi.helpers.vector("0,0"),
      position: gsfi.helpers.vector("0,0")
    }
  },
  defaultColor: function(color){
    if(color == null)
      return "#FFFFFF";
    return color;
  }
};

gsfi.pronouns = {
  "it": "it",
  "its": "its",
  "them": "it",
  "the": "the" //not technically a pronoun but it reads nicely
  "their": "their"
};

//Holds a bunch of shapes for which methods can be performed
gsfi.target = function(){
  return {
    objects: [],
    property: null,
    do: function(cb){
      this.objects.forEach(function(obj){
        cb(obj);
      });
    }
  };
}

gsfi.helpers = {
  validateArgs: function(context, expected, args, exact){
    if(exact == null)
      exact = true;

    if(args.length - 1 !== expected && exact){
      throw new GSFIArgumentError(context.line + ": incorrect number of arguments (" + (args.length - 1) + " for " + expected +")");
    }
    if(args.length - 1 < expected)
      throw new GSFIArgumentError(context.line + ": incorrect number of arguments (" + (args.length - 1) + " for " + expected +"+)");
  },
  vector: function(str){
    var split = str.split(',');
    //TODO: Validation
    return {
      x: parseFloat(split[0]),
      y: parseFloat(split[1])
    }
  },
  getTarget: function(context, str){
    var split = str.split('.');
    var id = gsfi.pronouns[split[0]],
        prop = split[1],
        target = null;
    if(id != null){
      context.current.property = null;
      target = context.current;
    }else{
      target = new gsfi.target
      target.objects = [context.get(split[0])];
    }

    if(target != null && prop != null)
      target.property = prop

    return target;
  }
};

gsfi.commands = {
  goto: function(context){
    gsfi.helpers.validateArgs(context, 1, arguments);
    var coord = gsfi.helpers.vector(arguments[1]); 
    context.position = coord;
  },
  draw: function(context){
    gsfi.helpers.validateArgs(context, 1, arguments);
    var shapeType = arguments[arguments.length - 1],
        color = arguments[1];

    if(color === shapeType)
      color = null;

    var s = context.addShape(gsfi.shapes.create(context, shapeType, color));
    context.current.objects = [s];
  },
  color: function(context){
    gsfi.helpers.validateArgs(context, 2, arguments);
    var target = gsfi.helpers.getTarget(context, arguments[1]);
        color = arguments[2];

    if(target == null)
      throw GSFIArgumentError(context.line + ": invalid target \"" + arguments[1] + "\"");
    if(color == null)
      throw GSFIArgumentError(context.line + ": invalid color \"" + arguments[2] + "\"");
    
    target.do(function(obj){
      obj.color = color;
    });
  },
  remove: function(context){
    gsfi.helpers.validateArgs(context, 1, arguments, false);

    for(var i = 1; i < arguments.length; i++){
      var t = gsfi.helpers.getTarget(context, arguments[i]);
      t.do(function(obj){
        context.remove(obj);
      });
    }
  },
  find: function(context){
    gsfi.helpers.validateArgs(context, 1, arguments, false);
  
    var newTarget = new gsfi.target,
        color = (arguments.length > 2) ? arguments[1] : null;
        shape = (arguments.length > 2) ? arguments[2] : argumnets[1];

    if(context.shapes[shape] == null)
      throw new GSFIArgumentError(context.line + ": there are no \"" + shape + "\" shapes");

    context.shapes[shape].forEach(function(obj){
      if(color == null){
        newTarget.objects.push(obj);
      }else if(obj.color === color){
        newTarget.objects.push(obj);
      }
    });

    context.current = newTarget;
  },
  remember: function(context){
    gsfi.helpers.validateArgs(context, 3, arguments);
    var name = arguments[3];
    var thing = null;

    var t = gsfi.helpers.getTarget(context, arguments[1]);
    if(t.property == null){   
      context.remember(name, t.objects[0]);      
    }else{
      context.remember(name, t.objects[0][t.property]); 
    }
  },
  set: function(context){
    gsfi.helpers.validateArgs(context, 3, arguments);
    var t = gsfi.helpers.getTarget(context, arguments[1]),
        v = context.memory[arguments[3]];

    if(v == null)
      v = gsfi.helpers.vector(arguments[3]);
    

    t.do(function(obj){
      if(t.property == null){
        obj = v;
      }else{
        obj[t.property] = v
      }
    });
  },
  debug: function(context){
    gsfi.helpers.validateArgs(context, 2, arguments);

    var t = gsfi.helpers.getTarget(context, arguments[2]),
        msg = arguments[1];
    t.do(function(obj){
      if(t.property == null){
        console.log(msg, obj);
      }else{
        console.log(msg, obj[t.property]);        
      }
    });
  }
};

gsfi.context = function(){
  return {
    line: 0,
    location: gsfi.helpers.vector("0, 0"),
    current: new gsfi.target,
    shapes: {},
    memory: {},
    addShape: function(shape){
      if(this.shapes[shape.type] == null)
        this.shapes[shape.type] = []
      this.shapes[shape.type].push(shape);
      shape.index = this.shapes[shape.type].length - 1;
      return shape;
    },
    remove: function(shape){
      if(shape.memoryIndex != null){
        delete this.memory[shape.memoryIndex];
      }
      this.shapes[shape.type].splice(shape.index, 1);
      
      //Adjust the indices of shapes that have changed
      if(shape.index < this.shapes[shape.type].length-1){
        for(var i = shape.index; i < this.shapes[shape.type].length; i++){
          this.shapes[shape.type][i].index = i;
        }
      }
    },
    remember: function(name, target){
      this.memory[name] = target;
      if(typeof target === "object")
        target.memoryIndex = name
    },
    get: function(name){
      var v = this.memory[name];
      if(v == null)
        throw new GSFIArgumentError(this.line + ": \"" + name + "\" is not set");
      return v;
    }
  };
}

gsfi.parser = {
  parse: function(source, tree){
    lines = source.split("\n");
    for(var i = 0; i < lines.length; i++){
      var line = lines[i];
      line = line.replace(/^\s+|\s+$/g, '');
      if(line === "")
        continue;

      tree.push(this.createCommandNode(line, i + 1));
    }

    return tree;
  },
  createCommandNode: function(line, lineNum){
    var input = line.split(' ');
    
    if(input.length === 1)
      throw new GSFIParseError(lineNum + ": invalid command, commands require arguments ");
    
    var command   = input[0],
        callback  = gsfi.commands[command],
        args      = [];

    if(callback == null)
      throw new GSFIParseError(lineNum + ": invalid command \"" + command + "\""); 

    for(var i = 1; i < input.length; i++){
      args.push(input[i]);
    }

    return {
      command: command,
      callback: callback,
      args: args,
      line: lineNum
    };
  }
};

gsfi.interpreter = {
  interpret: function(parseTree){
    var context = new gsfi.context;
    for(var i = 0; i < parseTree.length; i++){
      var cmd = parseTree[i],
          args = [context];
      context.line = cmd.line;

      for(var j=0; j < cmd.args.length; j++){
        args.push(cmd.args[j]);
      }
      
      cmd.callback.apply(null, args);
    }
    console.log(context);
  }
};