/*
  R A Y L O R D
  ------------------------------------------------------------
  Compile: gcc -O3 -o raylord raylord.c -lm
  Run:     ./raylord > out.ppm

  (c) 2026 - Someone who hates XML scene descriptions.
*/

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <float.h>

/* ------------------------------------------------------------
   M A T H   B R I C K S
   ------------------------------------------------------------ */

typedef struct { double x, y, z; } Vec3;

static inline Vec3 v3(double x, double y, double z) {
    Vec3 v = {x, y, z};
    return v;
}

static inline Vec3 add(Vec3 a, Vec3 b) { return v3(a.x+b.x, a.y+b.y, a.z+b.z); }
static inline Vec3 sub(Vec3 a, Vec3 b) { return v3(a.x-b.x, a.y-b.y, a.z-b.z); }
static inline Vec3 mul(Vec3 a, double s) { return v3(a.x*s, a.y*s, a.z*s); }
static inline Vec3 mulv(Vec3 a, Vec3 b) { return v3(a.x*b.x, a.y*b.y, a.z*b.z); }
static inline double dot(Vec3 a, Vec3 b) { return a.x*b.x + a.y*b.y + a.z*b.z; }
static inline Vec3 cross(Vec3 a, Vec3 b) {
    return v3(a.y*b.z - a.z*b.y,
              a.z*b.x - a.x*b.z,
              a.x*b.y - a.y*b.x);
}
static inline double len(Vec3 v) { return sqrt(dot(v, v)); }
static inline Vec3 norm(Vec3 v) { double l = len(v); return l>1e-12 ? mul(v, 1.0/l) : v; }

static inline double clamp(double x, double a, double b) {
    return x<a ? a : (x>b ? b : x);
}

/* ------------------------------------------------------------
   R A Y   &   H I T
   ------------------------------------------------------------ */

typedef struct {
    Vec3 orig;
    Vec3 dir;
} Ray;

static inline Ray ray(Vec3 o, Vec3 d) {
    Ray r = {o, norm(d)};
    return r;
}

static inline Vec3 point_at(Ray r, double t) {
    return add(r.orig, mul(r.dir, t));
}

/* ------------------------------------------------------------
   M A T E R I A L
   ------------------------------------------------------------ */

typedef struct {
    Vec3 color;       // diffuse/albedo
    double reflect;   // 0 = matte, 1 = mirror
    double shine;     // phong exponent (0 = no spec)
} Material;

static Material mat_matte(Vec3 c) {
    Material m = {c, 0.0, 0.0};
    return m;
}

static Material mat_mirror(Vec3 c, double ref) {
    Material m = {c, ref, 0.0};
    return m;
}

static Material mat_shiny(Vec3 c, double sh) {
    Material m = {c, 0.0, sh};
    return m;
}

/* ------------------------------------------------------------
   H I T   (carries material)
   ------------------------------------------------------------ */

typedef struct Hit {
    int happened;
    double t;
    Vec3 pos;
    Vec3 normal;
    Material mat;
} Hit;

static Hit no_hit(void) {
    Hit h = {0, DBL_MAX, {0,0,0}, {0,0,0}, {0,0,0}};
    return h;
}

/* ------------------------------------------------------------
   O B J E C T S
   ------------------------------------------------------------ */

typedef struct Sphere {
    Vec3 center;
    double radius;
    Material mat;
} Sphere;

static Hit hit_sphere(Sphere *s, Ray r, double t_min, double t_max) {
    Vec3 oc = sub(r.orig, s->center);
    double a = dot(r.dir, r.dir);
    double b = 2.0 * dot(oc, r.dir);
    double c = dot(oc, oc) - s->radius * s->radius;
    double disc = b*b - 4*a*c;

    if (disc < 0) return no_hit();

    double sqrt_disc = sqrt(disc);
    double t0 = (-b - sqrt_disc) / (2*a);
    double t1 = (-b + sqrt_disc) / (2*a);

    if (t0 > t_max || t1 < t_min) return no_hit();

    double t = (t0 >= t_min) ? t0 : t1;
    if (t < t_min || t > t_max) return no_hit();

    Vec3 pos = point_at(r, t);
    Vec3 normal = norm(sub(pos, s->center));

    Hit h = {1, t, pos, normal, s->mat};
    return h;
}

typedef struct Plane {
    Vec3 point;
    Vec3 normal;
    Material mat;
} Plane;

static Hit hit_plane(Plane *p, Ray r, double t_min, double t_max) {
    double denom = dot(p->normal, r.dir);
    if (fabs(denom) < 1e-6) return no_hit();

    double t = dot(sub(p->point, r.orig), p->normal) / denom;
    if (t < t_min || t > t_max) return no_hit();

    Vec3 pos = point_at(r, t);
    Hit h = {1, t, pos, p->normal, p->mat};
    return h;
}

/* ------------------------------------------------------------
   S C E N E
   ------------------------------------------------------------ */

#define MAX_OBJ 10

typedef struct {
    Sphere spheres[5];
    int n_spheres;
    Plane planes[5];
    int n_planes;
} Scene;

static Scene g_scene;

static void add_sphere(Vec3 c, double r, Material m) {
    if (g_scene.n_spheres < 5) {
        g_scene.spheres[g_scene.n_spheres++] = (Sphere){c, r, m};
    }
}

static void add_plane(Vec3 pt, Vec3 n, Material m) {
    if (g_scene.n_planes < 5) {
        g_scene.planes[g_scene.n_planes++] = (Plane){pt, norm(n), m};
    }
}

/* ------------------------------------------------------------
   L I G H T   &   S H A D O W S
   ------------------------------------------------------------ */

typedef struct {
    Vec3 pos;
    Vec3 color;
    double intensity;
} Light;

static Light g_lights[] = {
    {{5, 10, 5}, {1.0, 1.0, 1.0}, 1.5},
    {{-5, 5, 3}, {0.9, 0.7, 0.5}, 1.0}
};
#define N_LIGHTS (sizeof(g_lights)/sizeof(g_lights[0]))

static int in_shadow(Vec3 point, Vec3 light_pos, double t_max) {
    Vec3 dir = sub(light_pos, point);
    double dist = len(dir);
    Ray shadow_ray = ray(add(point, mul(norm(dir), 0.001)), dir);

    for (int i = 0; i < g_scene.n_spheres; i++) {
        Hit h = hit_sphere(&g_scene.spheres[i], shadow_ray, 0.0, dist);
        if (h.happened) return 1;
    }
    return 0;
}

/* ------------------------------------------------------------
   C H E C K E R   T E X T U R E   (procedural)
   ------------------------------------------------------------ */

static Vec3 checker_color(Vec3 pos) {
    int x = (int)floor(pos.x * 0.5);
    int z = (int)floor(pos.z * 0.5);
    if ((x + z) % 2 == 0)
        return v3(0.9, 0.9, 0.9);
    else
        return v3(0.2, 0.2, 0.3);
}

/* ------------------------------------------------------------
   I N T E R S E C T I O N   (closest hit)
   ------------------------------------------------------------ */

static Hit scene_intersect(Ray r) {
    Hit closest = no_hit();
    double t_max = 1e20;

    for (int i = 0; i < g_scene.n_spheres; i++) {
        Hit h = hit_sphere(&g_scene.spheres[i], r, 0.001, t_max);
        if (h.happened && h.t < closest.t) {
            closest = h;
            t_max = h.t;
        }
    }

    for (int i = 0; i < g_scene.n_planes; i++) {
        Hit h = hit_plane(&g_scene.planes[i], r, 0.001, t_max);
        if (h.happened && h.t < closest.t) {
            closest = h;
            t_max = h.t;
        }
    }

    return closest;
}

/* ------------------------------------------------------------
   S H A D I N G   (Phong + reflection)
   ------------------------------------------------------------ */

static Vec3 background_color(Ray r) {
    double t = 0.5 * (r.dir.y + 1.0);
    Vec3 white = {1.0, 1.0, 1.0};
    Vec3 blue  = {0.5, 0.7, 1.0};
    return add(mul(white, 1.0-t), mul(blue, t));
}

static Vec3 shade(Hit hit, Ray incident_ray, int depth) {
    if (!hit.happened) return background_color(incident_ray);

    Vec3 pos = hit.pos;
    Vec3 N = hit.normal;
    Vec3 V = norm(mul(incident_ray.dir, -1.0));
    Material mat = hit.mat;

    // Override floor color with checker
    if (fabs(N.y - 1.0) < 0.1) {
        mat.color = checker_color(pos);
    }

    Vec3 ambient = mul(mat.color, 0.1);
    Vec3 diffuse = {0,0,0};
    Vec3 specular = {0,0,0};

    for (int i = 0; i < (int)N_LIGHTS; i++) {
        Light L = g_lights[i];
        Vec3 light_dir = norm(sub(L.pos, pos));
        double diff = fmax(0.0, dot(N, light_dir));

        if (!in_shadow(pos, L.pos, len(sub(L.pos, pos)))) {
            Vec3 light_contrib = mul(L.color, L.intensity);
            diffuse = add(diffuse, mul(mulv(mat.color, light_contrib), diff));

            if (mat.shine > 0.0) {
                Vec3 H = norm(add(light_dir, V));
                double spec = pow(fmax(0.0, dot(N, H)), mat.shine);
                specular = add(specular, mul(light_contrib, spec));
            }
        }
    }

    Vec3 color = add(ambient, add(diffuse, specular));

    // Reflection
    if (depth < 3 && mat.reflect > 0.0) {
        Vec3 reflect_dir = sub(incident_ray.dir, mul(N, 2.0 * dot(incident_ray.dir, N)));
        Ray reflect_ray = { add(pos, mul(N, 0.001)), norm(reflect_dir) };
        Hit reflect_hit = scene_intersect(reflect_ray);
        Vec3 reflect_color = shade(reflect_hit, reflect_ray, depth+1);
        color = add(mul(color, 1.0 - mat.reflect), mul(reflect_color, mat.reflect));
    }

    return v3(clamp(color.x, 0.0, 1.0),
              clamp(color.y, 0.0, 1.0),
              clamp(color.z, 0.0, 1.0));
}

/* ------------------------------------------------------------
   R E N D E R   L O O P
   ------------------------------------------------------------ */

static void render(int w, int h, int samples) {
    printf("P3\n%d %d\n255\n", w, h);

    Vec3 cam_pos = {0, 1.5, -5};
    Vec3 cam_look = {0, 1, 0};
    Vec3 cam_up = {0, 1, 0};

    Vec3 forward = norm(sub(cam_look, cam_pos));
    Vec3 right = norm(cross(forward, cam_up));
    Vec3 up = cross(right, forward);

    double fov = 60.0 * M_PI / 180.0;
    double aspect = (double)w / h;
    double half_h = tan(fov/2);
    double half_w = half_h * aspect;

    for (int y = 0; y < h; y++) {
        for (int x = 0; x < w; x++) {
            Vec3 col = {0,0,0};

            for (int s = 0; s < samples; s++) {
                double u = ((double)x + (rand()/(double)RAND_MAX)) / w;
                double v = ((double)y + (rand()/(double)RAND_MAX)) / h;

                double px = (2.0*u - 1.0) * half_w;
                double py = (1.0 - 2.0*v) * half_h;

                Vec3 dir = norm(add(add(mul(right, px), mul(up, py)), forward));
                Ray r = ray(cam_pos, dir);

                Hit hit = scene_intersect(r);
                Vec3 c = shade(hit, r, 0);
                col = add(col, c);
            }

            col = mul(col, 1.0/samples);

            // Gamma correction
            col.x = sqrt(col.x);
            col.y = sqrt(col.y);
            col.z = sqrt(col.z);

            int ir = (int)(255.99 * col.x);
            int ig = (int)(255.99 * col.y);
            int ib = (int)(255.99 * col.z);

            printf("%d %d %d\n", ir, ig, ib);
        }
    }
}

/* ------------------------------------------------------------
   B U I L D   S C E N E
   ------------------------------------------------------------ */

static void build_scene(void) {
    g_scene.n_spheres = 0;
    g_scene.n_planes = 0;

    // Floor (color overridden by checker in shade)
    add_plane(v3(0,0,0), v3(0,1,0), mat_matte(v3(0.5,0.5,0.5)));

    // Mirror ball
    add_sphere(v3(0, 1.2, 2), 1.0, mat_mirror(v3(0.9,0.6,0.4), 0.9));

    // Little shiny sphere
    add_sphere(v3(1.8, 0.6, 1.5), 0.6, mat_shiny(v3(0.3,0.7,0.3), 32.0));

    // Another matte sphere
    add_sphere(v3(-1.5, 0.8, 2.5), 0.8, mat_matte(v3(0.7,0.3,0.3)));
}

/* ------------------------------------------------------------
   M A I N
   ------------------------------------------------------------ */

int main(void) {
    build_scene();

    int width = 800;
    int height = 600;
    int samples = 16;

    render(width, height, samples);

    return 0;
}
