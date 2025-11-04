import * as THREE from 'three/webgpu'
import Experience from './Experience.js'
import State from "@experience/State.js";

export default class Renderer {
    constructor() {
        this.experience = new Experience()

        this.canvas = this.experience.canvas
        this.sizes = this.experience.sizes

        this.debug = this.experience.debug
        this.resources = this.experience.resources
        this.html = this.experience.html


        this.setInstance()
        this.setDebug()
    }

    postInit() {
        this.camera = this.experience.mainCamera.instance
        this.scene = this.experience.mainScene
        this.state = this.experience.state
    }

    setInstance() {
        this.clearColor = '#010101'

        //console.log(THREE.WebGLRenderer.compile)

        //THREE.WebGLRenderer.prototype.compile = compilePatch.bind( THREE.WebGLRenderer.prototype.compile )

        this.instance = new THREE.WebGPURenderer({
            canvas: this.canvas,
            //powerPreference: "high-performance",
            antialias: true,
            //samples: 4,
            alpha: false,
            stencil: false,
            depth: true,
            useLegacyLights: false,
            physicallyCorrectLights: true,
            forceWebGL: false
        })

        this.instance.shadowMap.enabled = true;
        //this.instance.shadowMap.type = THREE.PCFShadowMap;
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap;


        //this.instance.compile = compilePatch.bind( this.instance.compile )

        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))

        this.instance.setClearColor(this.clearColor, 1)
        this.instance.setSize(this.sizes.width, this.sizes.height)

        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        //this.instance.toneMapping = THREE.AgXToneMapping
        this.instance.toneMappingExposure = 1.2
    }

    setDebug() {
        if (this.debug.active) {
            if (this.debug.panel) {
                const debugFolder = this.debug.panel.addFolder({
                    title: 'Renderer',
                    expanded: false,
                });

                debugFolder.addBinding(this.instance, "toneMapping", {
                    label: "Tone Mapping",
                    options: {
                        "No": THREE.NoToneMapping,
                        "Linear": THREE.LinearToneMapping,
                        "Reinhard": THREE.ReinhardToneMapping,
                        "Cineon": THREE.CineonToneMapping,
                        "ACESFilmic": THREE.ACESFilmicToneMapping,
                        "AgXToneMapping": THREE.AgXToneMapping,
                        "NeutralToneMapping": THREE.NeutralToneMapping
                    }
                }).on('change', () => {
                    if (this.state.postprocessing) {
                        this.experience.postProcess.composer.needsUpdate = true
                    }
                })

                // this.debugFolder.add( this.instance, "toneMappingExposure" )
                //     .min( 0 ).max( 2 ).step( 0.01 ).name( "Tone Mapping Exposure" );

                debugFolder.addBinding(this.instance, "toneMappingExposure", {
                    min: 0,
                    max: 2,
                    step: 0.01,
                    label: "Tone Mapping Exposure"
                })
            }

        }
    }

    update() {
        if (this.debug.active) {
            this.debugRender()
        } else {
            this.productionRender()
        }
    }

    productionRender() {
        // record an estimated GPU frame time using renderAsync promise
        try {
            const t0 = performance.now();
            // await the render promise so we can measure duration
            return this.instance.renderAsync(this.scene, this.camera).then(() => {
                const t1 = performance.now();
                if (!window.experience) return;
                window.experience.metrics = window.experience.metrics || {};
                window.experience.metrics.gpuFrameTime = t1 - t0;
            }).catch(() => {
                // ignore errors from render promise for timing
            });
        } catch (e) {
            // fallback: fire and forget
            this.instance.renderAsync(this.scene, this.camera)
        }
    }

    debugRender() {
        // same timing logic in debug mode
        try {
            const t0 = performance.now();
            return this.instance.renderAsync(this.scene, this.camera).then(() => {
                const t1 = performance.now();
                if (!window.experience) return;
                window.experience.metrics = window.experience.metrics || {};
                window.experience.metrics.gpuFrameTime = t1 - t0;
            }).catch(() => { })
        } catch (e) {
            this.instance.renderAsync(this.scene, this.camera)
        }
    }

    resize() {
        // Instance
        // console.log(this.sizes.width, this.sizes.height)
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    destroy() {

    }
}
