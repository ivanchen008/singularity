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

        // autoplay/idle demo for light-bending presentation
        this.autoPlay = {
            enabled: true,
            active: false,
            idleTimeout: 3000, // ms before autoplay starts
            amplitude: 0.35, // radians left-right swing (~20deg)
            speed: 0.5, // oscillation speed
            lastInteraction: Date.now(),
            startTime: 0,
            homing: false, // 是否处于归位阶段
            homeAngle: 0,  // 自动播放起始角度
        }

        this.setInstance()
        this.setControls()
        this._setAutoPlayListeners()
    }

    setInstance()
    {
        //const FOV = this.experience.isMobile ? 35 : 25

        this.instance = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 100)
        this.defaultCameraPosition = new THREE.Vector3(0, 0, 6); // 设置更远的默认观察距离（黑洞更小）

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
        this.controls.minDistance = 4; // 最小缩放距离（用户不能靠得比这更近）
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
        // ensure controls track enable state depending on autoplay
    }

    // Listen for user interactions to pause/resume autoplay

    _setAutoPlayListeners () {
        // 只监听真实用户输入事件
        const reset = () => {
            this.autoPlay.lastInteraction = Date.now();
            if (this.autoPlay.active) this._disableAutoPlay();
        };
        // 鼠标、触摸、键盘输入都重置 idle
        [
            'pointerdown', 'pointermove', 'mousedown', 'mousemove',
            'wheel', 'touchstart', 'touchmove', 'keydown', 'keyup'
        ].forEach(evt => {
            window.addEventListener(evt, reset, { passive: true });
        });
    }

    _enableAutoPlay () {
        if (!this.autoPlay.enabled) return
        this.autoPlay.active = true
        this.autoPlay.homing = true // 先归位
        this.autoPlay.startTime = Date.now()
        // 记录当前角度
        const pos = this.instance.position
        const radius = pos.length()
        // 只考虑xz平面
        this.autoPlay.currentAngle = Math.atan2(pos.x, pos.z)
        // disable manual controls while autoplaying
        if ( this.controls ) this.controls.enabled = false
    }

    _disableAutoPlay () {
        this.autoPlay.active = false
        // re-enable manual controls
        if ( this.controls ) this.controls.enabled = true
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
        
        // 自动播放逻辑：如果空闲超过阈值，启用自动左右摆动演示
        const now = Date.now()
        if ( this.autoPlay.enabled && !this.autoPlay.active && (now - this.autoPlay.lastInteraction) > this.autoPlay.idleTimeout ) {
            this._enableAutoPlay()
        }

        if ( this.autoPlay.active ) {
            const radius = this.instance.position.length();
            const y = this.instance.position.y;
            if (this.autoPlay.homing) {
                // 归位阶段：平滑插值到 homeAngle
                const curAngle = Math.atan2(this.instance.position.x, this.instance.position.z);
                const targetAngle = this.autoPlay.homeAngle;
                // 角度差归一化到 [-PI, PI]
                let delta = targetAngle - curAngle;
                while (delta > Math.PI) delta -= Math.PI * 2;
                while (delta < -Math.PI) delta += Math.PI * 2;
                // 插值到目标角度
                const nextAngle = curAngle + delta * 0.08;
                const x = Math.sin(nextAngle) * radius;
                const z = Math.cos(nextAngle) * radius;
                const targetPos = new THREE.Vector3(x, y, z);
                this.instance.position.lerp(targetPos, 0.08);
                this.instance.lookAt(this.controls.target);
                // 如果已经很接近目标角度，进入循环动画
                if (Math.abs(delta) < 0.01) {
                    this.autoPlay.homing = false;
                    this.autoPlay.startTime = Date.now(); // 归位完成后重置动画起点
                }
            } else {
                // 循环动画
                const t = (now - this.autoPlay.startTime) / 1000;
                const angle = Math.sin(t * this.autoPlay.speed) * this.autoPlay.amplitude;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                const targetPos = new THREE.Vector3(x, y, z);
                this.instance.position.lerp(targetPos, 0.08);
                this.instance.lookAt(this.controls.target);
            }
        } else {
            // 确保相机保持在允许的范围内
            const distance = this.instance.position.length();
            if (distance < this.controls.minDistance || distance > this.controls.maxDistance) {
                const direction = this.instance.position.clone().normalize();
                const clampedDistance = THREE.MathUtils.clamp(
                    distance,
                    this.controls.minDistance,
                    this.controls.maxDistance
                );
                this.instance.position.copy(direction.multiplyScalar(clampedDistance));
            }
        }

        this.instance.updateMatrixWorld() // To be used in projection
    }

    animateCameraPosition() {

    }
}
