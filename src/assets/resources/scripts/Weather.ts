
/**
 * 下雪
 */
export class Snow {

    private viewer: any;
    private snowSize?: number;
    private snowSpeed?: number;
    private snowStage: any;

    constructor(viewer: any, options: any) {
        if (!viewer) throw new Error('no viewer object!');
        options = options || {};
        this.snowSize = Cesium.defaultValue(options.snowSize, 0.02); //最好小于0.02
        this.snowSpeed = Cesium.defaultValue(options.snowSpeed, 60.0);
        this.viewer = viewer;
        this.init();
    }

    init() {
        this.snowStage = new Cesium.PostProcessStage({
            name: 'czm_snow',
            fragmentShader: this.snow(),
            uniforms: {
                snowSize: () => {
                    return this.snowSize;
                },
                snowSpeed: () => {
                    return this.snowSpeed;
                }
            }
        });
        this.viewer.scene.postProcessStages.add(this.snowStage);
    }

    destroy() {
        if (!this.viewer || !this.snowStage) return;
        this.viewer.scene.postProcessStages.remove(this.snowStage);
        // this.snowStage.destroy();
    }

    show(visible: boolean) {
        this.snowStage.enabled = visible;
    }

    snow() {
        return "uniform sampler2D colorTexture;\n\
            varying vec2 v_textureCoordinates;\n\
            uniform float snowSpeed;\n\
                    uniform float snowSize;\n\
            float snow(vec2 uv,float scale)\n\
            {\n\
                float time=czm_frameNumber/snowSpeed;\n\
                float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.;\n\
                uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale;\n\
                uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d;\n\
                p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k);\n\
                k=smoothstep(0.,k,sin(f.x+f.y)*snowSize);\n\
                return k*w;\n\
            }\n\
            void main(void){\n\
                vec2 resolution=czm_viewport.zw;\n\
                vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n\
                vec3 finalColor=vec3(0);\n\
                //float c=smoothstep(1.,0.3,clamp(uv.y*.3+.8,0.,.75));\n\
                float c=0.;\n\
                c+=snow(uv,30.)*.0;\n\
                c+=snow(uv,20.)*.0;\n\
                c+=snow(uv,15.)*.0;\n\
                c+=snow(uv,10.);\n\
                c+=snow(uv,8.);\n\
                c+=snow(uv,6.);\n\
                c+=snow(uv,5.);\n\
                finalColor=(vec3(c));\n\
                gl_FragColor=mix(texture2D(colorTexture,v_textureCoordinates),vec4(finalColor,1),.5);\n\
                }\n\
                ";
    }
}

/**
 * 下雨
 */
export class Rain {

    private viewer: any;
    private tiltAngle?: number;
    private rainSize?: number;
    private rainSpeed?: number;
    private rainStage: any;

    constructor(viewer: any, options: any) {
        if (!viewer) throw new Error('no viewer object!');
        options = options || {};
        //倾斜角度，负数向右，正数向左
        this.tiltAngle = Cesium.defaultValue(options.tiltAngle, -.6);
        this.rainSize = Cesium.defaultValue(options.rainSize, 0.3);
        this.rainSpeed = Cesium.defaultValue(options.rainSpeed, 60.0);
        this.viewer = viewer;
        this.init();
    }

    init() {
        this.rainStage = new Cesium.PostProcessStage({
            name: 'czm_rain',
            fragmentShader: this.rain(),
            uniforms: {
                tiltAngle: () => {
                    return this.tiltAngle;
                },
                rainSize: () => {
                    return this.rainSize;
                },
                rainSpeed: () => {
                    return this.rainSpeed;
                }
            }
        });
        this.viewer.scene.postProcessStages.add(this.rainStage);
    }

    destroy() {
        if (!this.viewer || !this.rainStage) return;
        this.viewer.scene.postProcessStages.remove(this.rainStage);
        // this.rainStage.destroy();
    }

    show(visible: boolean) {
        this.rainStage.enabled = visible;
    }

    rain() {
        return "uniform sampler2D colorTexture;\n\
                varying vec2 v_textureCoordinates;\n\
                uniform float tiltAngle;\n\
                uniform float rainSize;\n\
                uniform float rainSpeed;\n\
                float hash(float x) {\n\
                    return fract(sin(x * 133.3) * 13.13);\n\
                }\n\
                void main(void) {\n\
                    float time = czm_frameNumber / rainSpeed;\n\
                    vec2 resolution = czm_viewport.zw;\n\
                    vec2 uv = (gl_FragCoord.xy * 2. - resolution.xy) / min(resolution.x, resolution.y);\n\
                    vec3 c = vec3(.6, .7, .8);\n\
                    float a = tiltAngle;\n\
                    float si = sin(a), co = cos(a);\n\
                    uv *= mat2(co, -si, si, co);\n\
                    uv *= length(uv + vec2(0, 4.9)) * rainSize + 1.;\n\
                    float v = 1. - sin(hash(floor(uv.x * 100.)) * 2.);\n\
                    float b = clamp(abs(sin(20. * time * v + uv.y * (5. / (2. + v)))) - .95, 0., 1.) * 20.;\n\
                    c *= v * b;\n\
                    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c, 1), .5);\n\
                }\n\
                ";
    }
}

/**
 * 起雾
 */
export class Fog {

    private viewer: any;
    private visibility: number;
    private color: any;
    private _show: boolean;
    private fogStage: any;

    constructor(viewer: any, options: any) {
        if (!viewer) throw new Error('no viewer object!');
        options = options || {};
        this.visibility = Cesium.defaultValue(options.visibility, 0.1);
        this.color = Cesium.defaultValue(options.color,
            new Cesium.Color(0.8, 0.8, 0.8, 0.5));
        this._show = Cesium.defaultValue(options.show, !0);
        this.viewer = viewer;
        this.init();
    }

    init() {
        this.fogStage = new Cesium.PostProcessStage({
            name: 'czm_fog',
            fragmentShader: this.fog(),
            uniforms: {
                visibility: () => {
                    return this.visibility;
                },
                fogColor: () => {
                    return this.color;
                }
            }
        });
        this.viewer.scene.postProcessStages.add(this.fogStage);
    }

    destroy() {
        if (!this.viewer || !this.fogStage) return;
        this.viewer.scene.postProcessStages.remove(this.fogStage);
        // this.fogStage.destroy();
        // delete this.visibility;
        // delete this.color;
    }

    show(visible: boolean) {
        this._show = visible;
        this.fogStage.enabled = this._show;
    }

    fog() {
        return "uniform sampler2D colorTexture;\n\
         uniform sampler2D depthTexture;\n\
         uniform float visibility;\n\
         uniform vec4 fogColor;\n\
         varying vec2 v_textureCoordinates; \n\
         void main(void) \n\
         { \n\
            vec4 origcolor = texture2D(colorTexture, v_textureCoordinates); \n\
            float depth = czm_readDepth(depthTexture, v_textureCoordinates); \n\
            vec4 depthcolor = texture2D(depthTexture, v_textureCoordinates); \n\
            float f = visibility * (depthcolor.r - 0.3) / 0.2; \n\
            if (f < 0.0) f = 0.0; \n\
            else if (f > 1.0) f = 1.0; \n\
            gl_FragColor = mix(origcolor, fogColor, f); \n\
         }\n";
    }
}

/**
 * 闪电
 */
export class Lightning {

    private viewer: any;
    private visibility: number;
    private color: any;
    private _show: boolean;
    private fogStage: any;


    constructor(viewer: any, options: any) {
        if (!viewer) throw new Error('no viewer object!');
        options = options || {};
        this.visibility = Cesium.defaultValue(options.visibility, 0.1);
        this.color = Cesium.defaultValue(options.color,
            new Cesium.Color(0.8, 0.8, 0.8, 0.5));
        this._show = Cesium.defaultValue(options.show, !0);
        this.viewer = viewer;
        this.init();
    }

    init() {
        this.fogStage = new Cesium.PostProcessStage({
            name: 'czm_lightning',
            fragmentShader: this.fog(),
            uniforms: {
                visibility: () => {
                    return this.visibility;
                },
                fogColor: () => {
                    return this.color;
                }
            }
        });
        this.viewer.scene.postProcessStages.add(this.fogStage);
    }

    destroy() {
        if (!this.viewer || !this.fogStage) return;
        this.viewer.scene.postProcessStages.remove(this.fogStage);
        // this.fogStage.destroy();
        // delete this.visibility;
        // delete this.color;
    }

    show(visible: boolean) {
        this._show = visible;
        this.fogStage.enabled = this._show;
    }

    fog() {
        return `uniform sampler2D colorTexture;
         uniform sampler2D depthTexture;
         uniform float visibility;
         uniform vec4 fogColor;
         varying vec2 v_textureCoordinates; 
         varying vec2 v_st;

         float rand(float x)
        {
            return fract(sin(x)*75154.32912);
        }

        float rand3d(vec3 x)
        {
            return fract(375.10297 * sin(dot(x, vec3(103.0139,227.0595,31.05914))));
        }

        float noise(float x)
        {
            float i = floor(x);
            float a = rand(i), b = rand(i+1.);
            float f = x - i;
            return mix(a,b,f);
        }

        float perlin(float x)
        {
            float r=0.,s=1.,w=1.;
            for (int i=0; i<6; i++) {
                s *= 2.0;
                w *= 0.5;
                r += w * noise(s*x);
            }
            return r;
        }

        float noise3d(vec3 x)
        {
            vec3 i = floor(x);
            float i000 = rand3d(i+vec3(0.,0.,0.)), i001 = rand3d(i+vec3(0.,0.,1.));
            float i010 = rand3d(i+vec3(0.,1.,0.)), i011 = rand3d(i+vec3(0.,1.,1.));
            float i100 = rand3d(i+vec3(1.,0.,0.)), i101 = rand3d(i+vec3(1.,0.,1.));
            float i110 = rand3d(i+vec3(1.,1.,0.)), i111 = rand3d(i+vec3(1.,1.,1.));
            vec3 f = x - i;
            return mix(mix(mix(i000,i001,f.z), mix(i010,i011,f.z), f.y),
                    mix(mix(i100,i101,f.z), mix(i110,i111,f.z), f.y), f.x);
        }

        float perlin3d(vec3 x)
        {
            float r = 0.0;
            float w = 1.0, s = 1.0;
            for (int i=0; i<5; i++) {
                w *= 0.5;
                s *= 2.0;
                r += w * noise3d(s * x);
            }
            return r;
        }

        float f(float y)
        {
            float w = 0.4; 
            return w * (perlin(2. * y) - 0.5);
        }

        float plot(vec2 p, float d, bool thicker)
        {
            if (thicker) d += 5. * abs(f(p.y + 0.001) - f(p.y));
            return smoothstep(d, 0., abs(f(p.y) - p.x));
        }

        float cloud(vec2 uv, float speed, float scale, float cover)
        {
            float c = perlin3d(vec3(uv * scale, (czm_frameNumber/60.0) * speed * 2.));
            return max(0., c - (1. - cover));
        }

        float mountain(vec2 uv, float scale, float offset, float h1, float h2)
        {
            float h = h1 + perlin(scale*uv.x + offset) * (h2 - h1);
            return smoothstep(h, h+0.01, uv.y);
        }

        vec3 render(vec2 uv)
        {
            float x = czm_frameNumber/60.0 + 0.1;

            float m = 0.25;
            float i = floor(x/m);
            float f = x/m - i;
            float k = 0.4;
            float n = noise(i);
            float t = ceil(n-k);
            float d = max(0., n-k) / (1.-k);
            float o = ceil(t - f - (1. - d)); 
            float gt = 0.1; 
            float go = ceil(t - f - (1. - gt));
            
            float lightning = 0.;
            float light = 0.;
            float glare = 0.;
            
            if (o == 1.) {
                vec2 uv2 = uv;
                uv2.y += i * 2.; 
                float p = (noise(i+10.) - 0.5) * 2.; // position of lightning
                uv2.x -= p;
                
                float strike = plot(uv2, 0.01, true);
                float glow = plot(uv2, 0.04, false);
                float glow2 = plot(uv2, 1.5, false);

                lightning = strike * 0.4 + glow * 0.15;

                float h = noise(i+5.); 
                lightning *= smoothstep(h, h+0.05, uv.y + perlin(1.2*uv.x + 4.*h)*0.03);
                lightning += glow2 * 0.3;
                light = smoothstep(5., 0., abs(uv.x - p));
                glare = go * light;
            }
            
            vec3 clouds =
            vec3(0.5,0.7,1.) * mix(0.6, 0.9, cloud(uv, 0.2, 0.1, 1.0)) +
            vec3(0.7,0.8,1.) * 0.6 * cloud(uv*vec2(0.5,1.), 0.06, 0.8, 0.8) +
            vec3(0.9,0.9,1.) * 0.3 * cloud(uv*vec2(0.1,1.), 0.08, 5.5, 0.6) +
            vec3(1.,1.,1.) * 0.4 * cloud(uv*vec2(0.1,1.), 0.07, 10., 0.5);
        
        float horizon = mountain(uv, 0.8, 9., 0.3, 0.6);
        vec3 terrain = mix(vec3(0.25,0.3,0.3)*0.5, 1.5*vec3(0.15,0.2,0.3),
            1. - (1. - mountain(uv, 0.8, 3., 0.2, 0.4)) * 0.5 - 
            (1. - mountain(uv, 0.8, 17.5, 0.05, 0.25)) * 0.5);
        
        // vec3 background = mix(terrain, clouds, horizon);
        // background *= (0.2 + light * 0.5);
        clouds *= (0.2 + light * 0.5);
         return vec3(clouds + lightning + glare);
        
        // return vec3(background + lightning + glare);
        }

         void main(void) 
         { 
            vec2 resolution=czm_viewport.zw;
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            uv.x = 2. * uv.x - 1.;
            uv.x *= resolution.x/resolution.y;
            // gl_FragColor =vec4(render(uv),0.1); 
            gl_FragColor=mix(texture2D(colorTexture,v_textureCoordinates),vec4(render(uv),1),.5);
         }
         `;
    }
}
