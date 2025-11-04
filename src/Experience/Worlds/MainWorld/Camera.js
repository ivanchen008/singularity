import * as THREE from 'three/webgpu'
import Experience from '@experience/Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import gsap from "gsap";

export default class Camera
{
    constructor( parameters = {} )
    {
        this.experience = new Experience()
        this.renderer = this.experience.renderer.instance
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.canvas = this.experience.canvas
        this.timeline = this.experience.timeline
        this.scene = parameters.world.scene
        this.cursorEnabled = false

        this.lerpVector = new THREE.Vector3();

        this.setInstance()
        this.setControls()
    }

    setInstance()
    {
        //const FOV = this.experience.isMobile ? 35 : 25
        this.instance = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 100)
    this.defaultCameraPosition = new THREE.Vector3(0, 0, 4.5); // 设置默认观察距离（略微拉远，限制最大放大）

        this.instance.position.copy(this.defaultCameraPosition)
        this.instance.lookAt(new THREE.Vector3(0, 0, 0));

        // 设置相机初始位置
        this.targetPosition = this.defaultCameraPosition.clone();
        this.lerpVector.copy(this.instance.position);
    }

    setControls()
    {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.1; // 增加阻尼效果
        
        // 限制缩放范围 — 限制最大放大（即最小距离）以稳定性能
        this.controls.minDistance = 3.0; // 最小缩放距离（用户不能靠得比这更近）
        this.controls.maxDistance = 8.0; // 最大缩放距离
        
        // 限制垂直旋转角度
        this.controls.minPolarAngle = Math.PI * 0.25; // 45度
        this.controls.maxPolarAngle = Math.PI * 0.75; // 135度
        
        // 启用缩放限制
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 0.5; // 降低缩放速度
        
        this.controls.enabled = true;
        this.controls.target = new THREE.Vector3(0, 0, 0);
        
        // 添加平滑插值
        this.controls.enableSmooth = true;
        this.controls.smoothTime = 0.5;


        // this.controls.mouseButtons = {
        //     LEFT: THREE.MOUSE.ROTATE,
        //     MIDDLE: null,
        //     RIGHT: null,  // Отключает действие для правой кнопки мыши
        // };
        //
        // this.controls.enableZoom = false;


        this.transformControls = new TransformControls( this.instance, this.renderer.domElement );
        //this.transformControls.addEventListener( 'change', render );
        this.transformControls.addEventListener( 'dragging-changed', ( event ) => {
            this.controls.enabled = ! event.value;
        } );

        this.scene.add( this.transformControls.getHelper() );

        this._setListeners()
    }

    _setListeners() {
        const control = this.transformControls;
        window.addEventListener( 'keydown', ( event ) => {

            switch ( event.key ) {

                case 'q':
                    control.setSpace( control.space === 'local' ? 'world' : 'local' );
                    break;

                case 'Shift':
                    control.setTranslationSnap( 1 );
                    control.setRotationSnap( THREE.MathUtils.degToRad( 15 ) );
                    control.setScaleSnap( 0.25 );
                    break;

                case 'w':
                    control.setMode( 'translate' );
                    break;

                case 'e':
                    control.setMode( 'rotate' );
                    break;

                case 'r':
                    control.setMode( 'scale' );
                    break;

                case '+':
                case '=':
                    control.setSize( control.size + 0.1 );
                    break;

                case '-':
                case '_':
                    control.setSize( Math.max( control.size - 0.1, 0.1 ) );
                    break;

                case 'x':
                    control.showX = ! control.showX;
                    break;

                case 'y':
                    control.showY = ! control.showY;
                    break;

                case 'z':
                    control.showZ = ! control.showZ;
                    break;

                case ' ':
                    control.enabled = ! control.enabled;
                    break;

                case 'Escape':
                    control.reset();
                    break;

            }

        } );

        window.addEventListener( 'keyup', function ( event ) {

            switch ( event.key ) {

                case 'Shift':
                    control.setTranslationSnap( null );
                    control.setRotationSnap( null );
                    control.setScaleSnap( null );
                    break;

            }

        } );
    }

    resize()
    {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update()
    {
        this.controls?.update()

        this.instance.updateMatrixWorld() // To be used in projection
    }

    animateCameraPosition() {

    }
}
