// Author: 张怡
// Title: 细胞噪声

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 random(vec2 st){
  return  fract(
        sin(
            vec2(
                dot(st, vec2(127.1,311.7)),
                dot(st, vec2(269.5,183.3))
            )
        ) * 43758.5453
    );
}

float noise(vec2 p) {
    vec2 i = floor(p); // 获取当前网格索引 i
    vec2 f = fract(p); // 获取当前片元在网格内的相对位置
    float F1 = 1.;
    // 遍历当前像素点相邻的 9 个网格特征点
    for (int j = -1; j <= 1; j++) {
        for (int k = -1; k <= 1; k++) {
            vec2 neighbor = vec2(float(j), float(k));
            vec2 point = random(i + neighbor);
            float d = length(point + neighbor - f);
            F1=min(F1,d);
        }
    }
    return F1;
}

// 泰森多变形
float noise2(vec2 p) {
    vec2 i = floor(p); // 获取当前网格索引 i
    vec2 f = fract(p); // 获取当前片元在网格内的相对位置
    float F1 = 1.;
    float F2 = 1.;
    // 遍历当前像素点相邻的 9 个网格特征点
    for (int j = -1; j <= 1; j++) {
        for (int k = -1; k <= 1; k++) {
            vec2 neighbor = vec2(float(j), float(k));
            vec2 point = random(i + neighbor);
            float d = length(point + neighbor - f);
            if(F1>d){
                F2 =F1;
                F1=d;
            }
        }
    }
    return F2;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    
    float n = noise(st*6.-u_time);  // 通过噪声函数计算片元坐标对应噪声值
    gl_FragColor = vec4(vec3(pow(n, 2.)), 1.0);
}