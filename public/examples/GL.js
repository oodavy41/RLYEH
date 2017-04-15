class GLg {
    constructor() {
        this.gl = null;

        this.mouseCTRL_flag = false;
        this.client_pos = [-1, 0, -1, 0];
        this.fps_angel = [0, 0];

        this.mtllib = {};
        this.light_d = null;
        this.light_c = null;
        this.camera_pos = null;
        this.camera_front = null;
        this.camera_up = null;
        this.camera_info = null;
        this.camera_ptype = null;
        this.mvp = null;
    }

    create(id) {
        this.gl = initgl(id);
    }

    set_light(direction, color) {
        this.light_c = color;
        this.light_d = direction;
    }

    set_cam_pos(pos) {
        this.camera_pos = pos;
        this.makemvp();
    }

    set_cam_front(lookfront) {
        this.camera_front = lookfront;
        this.makemvp();
    }

    make_cam_look() {
        var pos = this.camera_pos;
        var front = this.camera_front;
        return [pos[0] + front[0], pos[1] + front[1], pos[2] + front[2]];
    }

    set_cam_up(up) {
        this.camera_up = up;
        this.makemvp();
    }

    set_cam_info(info) {
        this.camera_info = info;
        this.makemvp();
    }

    //设定初始相机朝向，作为今后视角转向基础
    set_cam_ptype() {
        this.camera_ptype = this.make_cam_look();
    }

    makemvp() {
        if (this.camera_pos && this.camera_front && this.camera_up && this.camera_info) {
            this.mvp = makeMvp([this.camera_pos, this.make_cam_look(), this.camera_up], this.camera_info);
        }
    }

    fps_ctrl() {
        var ret = [0, 0];

        if (this.client_pos[2] != -1) {
            if (this.client_pos[0] != -1) {
                ret[0] = this.client_pos[2] - this.client_pos[0];
                ret[1] = this.client_pos[3] - this.client_pos[1];
            }
            this.client_pos[0] = this.client_pos[2];
            this.client_pos[1] = this.client_pos[3];
        }

        this.fps_angel[0] += Math.asin(-ret[1] / set.FPSraid) / Math.PI * 90;
        this.fps_angel[1] += Math.asin(-ret[0] / set.FPSraid) / Math.PI * 90;


        if (this.fps_angel[0] > 89)
            this.fps_angel[0] = 89;
        if (this.fps_angel[0] < -89)
            this.fps_angel[0] = -89;
        if (this.fps_angel[1] > 180)
            this.fps_angel[1] = -360 + this.fps_angel[1];
        if (this.fps_angel[1] < -180)
            this.fps_angel[1] = 360 + this.fps_angel[1];

        console.log(this.fps_angel[0] + '|' + this.fps_angel[1]);


        var lookat = this.camera_ptype;
        var nlookat = vec3.create();
        vec3.rotateX(nlookat, lookat, this.camera_pos, this.fps_angel[0] / 90);
        vec3.rotateY(nlookat, nlookat, this.camera_pos, this.fps_angel[1] / 90);
        this.camera_front = [nlookat[0] - this.camera_pos[0], nlookat[1] - this.camera_pos[1], nlookat[2] - this.camera_pos[2]]

        this.makemvp();


        return ret;
    }


    //arr格式[[positions],[normals],[color/textureCood],[index],textureSrc]
    get_model(arr, flag) {
        var c4t2;
        switch (flag) {
            case this.COLOR:
                c4t2 = 4;
                break;
            case this.TEXTURE:
                c4t2 = 2;
                if (arr[4])
                    this.textures.push(create_texture(arr[4]));
                break;
        }

        this.vert_arr['pos'] = upload_array_att(
            arr[0], 'position', this.prog, this.gl, [3, this.gl.FLOAT, false, 0, 0]);

        this.vert_arr['nor'] = upload_array_att(
            arr[1], 'normal', this.prog, this.gl, [3, this.gl.FLOAT, false, 0, 0]);

        this.vert_arr['col/coo'] = upload_array_att(
            arr[2], 'color', this.prog, this.gl, [c4t2, this.gl.FLOAT, false, 0, 0]);

        this.vert_arr['ind'] = create_ibo(arr[3], this.gl);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vert_arr['ind']);
        this.IBOlength = arr[3].length;

    }

    //若传入texture需要传入经过create_texture返回的['tex']
    set_uniform(uni_arr) {
        var that = this;
        var gl = this.gl;
        uni_arr.forEach(function(e) {
            var uni;
            switch (e[0]) {
                case that.M4F:
                    uni = gl.getUniformLocation(that.prog, e[1]);
                    gl.uniformMatrix4fv(uni, false, e[2]);
                    break;
                case that.V3F:
                    uni = gl.getUniformLocation(that.prog, e[1]);
                    gl.uniform3fv(uni, e[2]);
                    break;
                case that.I1I:
                    uni = gl.getUniformLocation(that.prog, e[1]);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, e[2]);
                    gl.uniform1i(uni, 0);
                    break;
            }
            that.uniforms[e[1]] = uni;
        })
    }

    set_static_mvp(mvp) {
        this.stat_mvp_mat = mvp;
    }

    update() {
        var m = mat4.create();
        mat4.rotateY(m, this.stat_mvp_mat, (new Date()).getTime() / 1000);
        //mat4.rotateX(m, m, (new Date()).getTime() / 2000);
        //mat4.rotateZ(m, m, (new Date()).getTime() / 3000);
        this.gl.uniformMatrix4fv(this.uniforms['mvpMatrix'], false, m);

        this.gl.drawElements(this.gl.TRIANGLES, this.IBOlength, this.gl.UNSIGNED_SHORT, 0);
    }
}
