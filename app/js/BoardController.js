CHECKERS.BoardController = function (options) {
  'use strict';

  options = options || {};

  var instance = this;

  var containerEl = options.containerEl || null;
  var assetsUrl = options.assetsUrl || '';
  var renderer;
  var projector;
  var scene;
  var camera;
  var cameraController;
  var lights = {};
  var materials = {};
  var pieceGeometry = null;
  var boardModel;
  var groundModel;

  var squareSize = 10;

  var board = [
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '']
  ];


  var selectedPiece = null;
  var callbacks = options.callbacks || {};

  this.drawBoard = function (callback) {
    initEngine();
    initLights();
    initMaterials();

    initObjects(function () {
      onAnimationFrame();

      callback();
    });

    initListeners();
  };

  this.addPiece = function (piece) {
    var pieceMesh = new THREE.Mesh(pieceGeometry);
    var pieceObjGroup = new THREE.Object3D();
    //
    if (piece.color === CHECKERS.WHITE) {
      pieceObjGroup.color = CHECKERS.WHITE;
      pieceMesh.material = materials.whitePieceMaterial;
    } else {
      pieceObjGroup.color = CHECKERS.BLACK;
      pieceMesh.material = materials.blackPieceMaterial;
    }

    // create shadow plane
    var shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(squareSize, squareSize, 1, 1), materials.pieceShadowPlane);
    shadowPlane.rotation.x = -90 * Math.PI / 180;

    pieceObjGroup.add(pieceMesh);
    pieceObjGroup.add(shadowPlane);

    pieceObjGroup.position = boardToWorld(piece.pos);

    board[ piece.pos[0] ][ piece.pos[1] ] = pieceObjGroup;

    scene.add(pieceObjGroup);
  };

  this.removePiece = function (row, col) {
    console.log ("Removing piece at: " + row + ", " + col);

    if (board[row][col]) {
      scene.remove(board[row][col]);
    }

    board[row][col] = 0;
  };

  this.movePiece = function (from, to) {
    console.log("movePiece from " + from + " to " + to);
    var piece = board[ from[0] ][ from[1] ];
    var capturedPiece = board[ to[0] ][ to[1] ];
    var toWorldPos = boardToWorld(to);

    // update internal board
    board[ from[0] ][ from[1] ] = 0;
    delete board[ to[0] ][ to[1] ];
    board[ to[0] ][ to[1] ] = piece;

    // capture piece
    if (capturedPiece !== 0)
      scene.remove(capturedPiece);
    }

    // move piece
    if (!isAnimating) {
      piece.position.x = toWorldPos.x;
      piece.position.z = toWorldPos.z;

      piece.children[0].position.y = 0;
    }
  };

  var animatingPiece;
  var animatingDestination;
  var isAnimating = false;

  this.startAnimatingPiece = function (from, to) {
    animatingPiece = board[from[0]][from[1]];
    animatingPiece.children[0].position.y += 0.75;
    var fromX = animatingPiece.position.x;
    var fromZ = animatingPiece.position.z;
    var toX = fromX + (to[1] - from[1]) * 10;
    var toZ = fromZ + (to[0] - from[0]) * 10;
    console.log ("fromX, fromZ: " + fromX + " " + fromZ);
    console.log ("toX, toZ: " + toX + " " + toZ);
    animatingDestination = new THREE.Vector3(toX, 0, toZ);
    isAnimating = true;
    instance.movePiece(from, to);
    if (callbacks.pieceDropped)
      callbacks.pieceDropped(from, to, false);
    }

    function initEngine() {
      var viewWidth = containerEl.offsetWidth;
      var viewHeight = containerEl.offsetHeight;
      renderer = new THREE.WebGLRenderer({
        antialias: true
      });
      renderer.setSize(viewWidth, viewHeight);
      projector = new THREE.Projector();
      camera = new THREE.PerspectiveCamera(35, viewWidth / viewHeight, 1, 1000);
      camera.position.set(squareSize * 4, 120, 150);
      cameraController = new THREE.OrbitControls(camera, containerEl);
      cameraController.center = new THREE.Vector3(squareSize * 4, 0, squareSize * 4);
      scene = new THREE.Scene();
      scene.add(camera);
      containerEl.appendChild(renderer.domElement);
    }

    function initLights() {
      lights.topLight = new THREE.PointLight();
      lights.topLight.position.set(squareSize * 4, 150, squareSize * 4);
      lights.topLight.intensity = 0.4;
      lights.whiteSideLight = new THREE.SpotLight();
      lights.whiteSideLight.position.set( squareSize * 4, 100, squareSize * 4 + 200);
      lights.whiteSideLight.intensity = 0.8;
      lights.whiteSideLight.shadowCameraFov = 55;
      lights.blackSideLight = new THREE.SpotLight();
      lights.blackSideLight.position.set( squareSize * 4, 100, squareSize * 4 - 200);
      lights.blackSideLight.intensity = 0.8;
      lights.blackSideLight.shadowCameraFov = 55;
      lights.movingLight = new THREE.PointLight(0xf9edc9);
      lights.movingLight.position.set(0, 10, 0);
      lights.movingLight.intensity = 0.5;
      lights.movingLight.distance = 500;
      scene.add(lights.topLight);
      scene.add(lights.whiteSideLight);
      scene.add(lights.blackSideLight);
      scene.add(lights.movingLight);
    }

    function initMaterials() {
      materials.boardMaterial = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture(assetsUrl + 'board_texture.jpg')
      });
      materials.groundMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        map: THREE.ImageUtils.loadTexture(assetsUrl + 'ground.png')
      });
      materials.darkSquareMaterial = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture(assetsUrl + 'square_dark_texture.jpg')
      });
      //
      materials.lightSquareMaterial = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture(assetsUrl + 'square_light_texture.jpg')
      });
      materials.whitePieceMaterial = new THREE.MeshPhongMaterial({
        color: 0xe9e4bd,
        shininess: 20
      });
      materials.blackPieceMaterial = new THREE.MeshPhongMaterial({
        color: 0x9f2200,
        shininess: 20
      });
      materials.pieceShadowPlane = new THREE.MeshBasicMaterial({
        transparent: true,
        map: THREE.ImageUtils.loadTexture(assetsUrl + 'piece_shadow.png')
      });
    }

    function initObjects(callback) {
      var loader = new THREE.JSONLoader();
      var totalObjectsToLoad = 2;
      var loadedObjects = 0;

      function checkLoad() {
        loadedObjects++;
        if (loadedObjects === totalObjectsToLoad && callback) {
          callback();
        }
      }
      loader.load(assetsUrl + 'board.js', function (geom) {
        boardModel = new THREE.Mesh(geom, materials.boardMaterial);
        boardModel.position.y = -0.02;
        scene.add(boardModel);
        checkLoad();
      });
      loader.load(assetsUrl + 'piece.js', function (geometry) {
        pieceGeometry = geometry;

        checkLoad();
      });
      groundModel = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 1, 1), materials.groundMaterial);
      groundModel.position.set(squareSize * 4, -1.52, squareSize * 4);
      groundModel.rotation.x = -90 * Math.PI / 180;
      scene.add(groundModel);

      var squareMaterial;
      for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
          if ((row + col) % 2 === 0) {
            squareMaterial = materials.lightSquareMaterial;
          } else {
            squareMaterial = materials.darkSquareMaterial;
          }

          var square = new THREE.Mesh(new THREE.PlaneGeometry(squareSize, squareSize, 1, 1), squareMaterial);

          square.position.x = col * squareSize + squareSize / 2;
          square.position.z = row * squareSize + squareSize / 2;
          square.position.y = -0.01;

          square.rotation.x = -90 * Math.PI / 180;

          scene.add(square);
        }
      }

    }

    function initListeners() {
      var domElement = renderer.domElement;

      domElement.addEventListener('mousedown', onMouseDown, false);
      domElement.addEventListener('mouseup', onMouseUp, false);
    }

    function onAnimationFrame() {
      requestAnimationFrame(onAnimationFrame);

      cameraController.update();

      // update moving light position
      lights.movingLight.position.x = camera.position.x;
      lights.movingLight.position.z = camera.position.z;

      var thresh = 1;
      if (isAnimating) {
        if (Math.abs(animatingDestination.x - animatingPiece.position.x) <= thresh) {
          animatingPiece.position.x = animatingDestination.x;
        }
        if (Math.abs(animatingDestination.z - animatingPiece.position.z) <= thresh) {
          animatingPiece.position.z = animatingDestination.z;
        }

        var speed = 0.5;
        if (animatingDestination.x < animatingPiece.position.x) {
          animatingPiece.position.x -= speed;
        } else if (animatingDestination.x > animatingPiece.position.x) {
          animatingPiece.position.x += speed;
        } else if (animatingDestination.z < animatingPiece.position.z) {
          animatingPiece.position.z -= speed;
        } else if (animatingDestination.z > animatingPiece.position.z) {
          animatingPiece.position.z += speed;
        } else {
          isAnimating = false;
          animatingPiece.children[0].position.y -= 0.75;
        }
      }

      renderer.render(scene, camera);
    }

    function onMouseDown(event) {
      var mouse3D = getMouse3D(event);

      if (isMouseOnBoard(mouse3D)) {
        if (isPieceOnMousePosition(mouse3D)) {
          pickupPiece(mouse3D);
          renderer.domElement.addEventListener('mousemove', onMouseMove, false);
        }

        cameraController.userRotate = false;
      }
    }

    function onMouseUp(event) {
      renderer.domElement.removeEventListener('mousemove', onMouseMove, false);

      var mouse3D = getMouse3D(event);

      if (isMouseOnBoard(mouse3D) && selectedPiece) {
        var toBoardPos = worldToBoard(mouse3D);

        if (toBoardPos[0] === selectedPiece.boardPos[0] && toBoardPos[1] === selectedPiece.boardPos[1]) {
          dropPiece();
        } else {
          if (callbacks.pieceCanDrop && callbacks.pieceCanDrop(selectedPiece.boardPos, toBoardPos, selectedPiece.obj.color)) {
            if (callbacks.send) {
              var from = [selectedPiece.boardPos[0], selectedPiece.boardPos[1]];
              var to = [toBoardPos[0], toBoardPos[1]];
              callbacks.send (from[0], from[1], to[0], to[1], function () {
                instance.movePiece(selectedPiece.boardPos, toBoardPos);

                if (callbacks.pieceDropped) {
                  callbacks.pieceDropped(selectedPiece.boardPos, toBoardPos);
                }


                selectedPiece = null;
              }, function() {
                dropPiece();
              });
            }


          } else {
            dropPiece();
          }
        }
      } else {
        dropPiece();
      }

      cameraController.userRotate = true;
    }

    function onMouseMove(event) {
      var mouse3D = getMouse3D(event);

      // drag selected piece
      if (selectedPiece) {
        selectedPiece.obj.position.x = mouse3D.x;
        selectedPiece.obj.position.z = mouse3D.z;

        // lift piece
        selectedPiece.obj.children[0].position.y = 0.75;
      }
    }

    function boardToWorld (pos) {
      var x = (1 + pos[1]) * squareSize - squareSize / 2;
      var z = (1 + pos[0]) * squareSize - squareSize / 2;

      return new THREE.Vector3(x, 0, z);
    }

    function worldToBoard(pos) {
      var i = 8 - Math.ceil((squareSize * 8 - pos.z) / squareSize);
      var j = Math.ceil(pos.x / squareSize) - 1;

      if (i > 7 || i < 0 || j > 7 || j < 0 || isNaN(i) || isNaN(j)) {
        return false;
      }

      return [i, j];
    }

    function getMouse3D(mouseEvent) {
      var x, y;
      //
      if (mouseEvent.offsetX !== undefined) {
        x = mouseEvent.offsetX;
        y = mouseEvent.offsetY;
      } else {
        x = mouseEvent.layerX;
        y = mouseEvent.layerY;
      }

      var pos = new THREE.Vector3(0, 0, 0);
      var pMouse = new THREE.Vector3(
        (x / renderer.domElement.width) * 2 - 1,
        -(y / renderer.domElement.height) * 2 + 1,
        1
      );
      //
      projector.unprojectVector(pMouse, camera);

      var cam = camera.position;
      var m = pMouse.y / ( pMouse.y - cam.y );

      pos.x = pMouse.x + ( cam.x - pMouse.x ) * m;
      pos.z = pMouse.z + ( cam.z - pMouse.z ) * m;

      return pos;
    }

    function isMouseOnBoard(pos) {
      if (pos.x >= 0 && pos.x <= squareSize * 8 &&
        pos.z >= 0 && pos.z <= squareSize * 8) {
          return true;
        } else {
          return false;
        }
      }

      function isPieceOnMousePosition(pos) {
        var boardPos = worldToBoard(pos);

        if (boardPos && board[ boardPos[0] ][ boardPos[1] ] !== 0) {
          return true;
        }

        return false;
      }

      function pickupPiece(pos) {
        var boardPos = worldToBoard(pos);

        // check for piece presence
        if (board[ boardPos[0] ][ boardPos[1] ] === '') {
          selectedPiece = null;
          return false;
        }

        selectedPiece = {};
        selectedPiece.boardPos = boardPos;
        selectedPiece.obj = board[ boardPos[0] ][ boardPos[1] ];
        selectedPiece.origPos = selectedPiece.obj.position.clone();

        return true;
      }

      function dropPiece() {
        if (!selectedPiece) {
          return;
        }

        selectedPiece.obj.position = selectedPiece.origPos;
        selectedPiece.obj.children[0].position.y = 0;

        selectedPiece = null;
      }
    };
