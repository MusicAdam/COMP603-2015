var context, graphics, stage;

function initPixi(){
  // create an new instance of a pixi stage
  stage = new PIXI.Container(0x66FF99);
 
  // create a renderer instance.
  var renderer = PIXI.autoDetectRenderer(400, 300);
 
  // add the renderer view element to the DOM
  document.body.appendChild(renderer.view);
 
  requestAnimationFrame( animate );
 
  function animate() {
 
      requestAnimationFrame( animate );
 
      // render the stage   
      renderer.render(stage);
  }
}

function drawSquare(stage, graphics, shape){
  //graphics.beginFill(parseInt(shape.color));
  graphics.beginFill(parseInt(shape.color, 16));

  // set the line style to have a width of 5 and set the color to red
  graphics.lineStyle(0, 0xFF0000);

  // draw a rectangle
  graphics.drawRect(shape.position.x, shape.position.y, shape.size.x, shape.size.y);

  stage.addChild(graphics);
}

function drawContext(stage, graphics){
  if(context == null) return;

  $.each(context.shapes, function(type, shapes){
    $.each(shapes, function(index, shape){
      switch(type){
        case "square":
          drawSquare(stage, graphics, shape);
          break;
        case "circle":
          drawCirlce(stage, graphics, shape);
          break;
      }
    });
  });
}

function clearStage(){
  while(stage.children[0]) { stage.removeChild(stage.children[0]); }
}

function run(id, textarea){
  clearStage();

  try{
    var src = (textarea) ? $(id).val() : $(id).text(),
        gsfiParseTree = gsfi.parser.parse(src, []);

      context = gsfi.interpreter.interpret(gsfiParseTree);

      graphics = new PIXI.Graphics();
      drawContext(stage, graphics);
      $(id).parent().find('.error').css('display', 'none');
    }catch(err){
      $(id).parent().find('.error').css('display', 'inherit');
      $(id).parent().find('.error').html(err.name + " " + err.message);
    }
}