class PageRecorder{
    constructor(prefix, config_default){
        if (!navigator.mediaDevices) {
            console.error('getUserMedia is not supported . . . ');
            return;
        }
        this.config = {};
        
        this.status = false;
        this.container = null;
        this.mediaRecorder = null;
        // this.constraints = {};
        this.chunks = [];
        this.controls = {
            'record_button': null,
            'stop_button': null,
            'duration_input': null
        }
        this.timer = null;
        this.loadStylesheets();
        this.init(config_default);
    }
    async init(config_default){
        console.log('init');        
        const params = new URLSearchParams(window.location.search);
        this.status = params.get(this.prefix + 'status') ? params.get(this.prefix + 'status') : -2;
        if(this.status === -2) {
            let config = config_default;
            // this.config['viewportOnly'] = config !== false && config['viewportonly'] ? config['viewportonly'] : false;
            // this.config['name'] = config !== false && config['name'] ? config['name'] : '';
            this.config['duration'] = config !== false && config['duration'] ? Number(config['duration']) : -1;
            this.config['delay'] = config !== false && config['delay'] ? Number(config['delay']) : 0;
            this.config['width'] = config !== false && config['width'] ? Number(config['width']) : window.innerWidth;
            this.config['height'] = config !== false && config['height'] ? Number(config['height']) : window.innerHeight;
        } else {

            // this.config['viewportOnly'] = params.get(this.prefix + 'viewportonly') ? params.get(this.prefix + 'viewportonly') : false;
            // this.config['name'] = params.get(this.prefix + 'name') ? params.get(this.prefix + 'name') : '';
            this.config['duration'] = params.get(this.prefix + 'duration') ? Number(params.get(this.prefix + 'duration')) : -1;
            this.config['delay'] = params.get(this.prefix + 'delay') ? Number(params.get(this.prefix + 'delay')) : 0;
            this.config['width'] = params.get(this.prefix + 'width') ? Number(params.get(this.prefix + 'width')) : window.innerWidth;
            this.config['height'] = params.get(this.prefix + 'height') ? Number(params.get(this.prefix + 'height')) : window.innerHeight;
        }
        
        this.renderControls();
        this.addListeners();
        this.updateStatus(this.status);
    }
    renderControls(){
        this.container = document.createElement('div');
        this.container.id = this.prefix + 'controls-container';
        /* buttons */
        this.controls.generate_button = document.createElement('button');
        this.controls.generate_button.className = 'controls-element ' + this.prefix + 'generate-button';
        this.controls.generate_button.innerText = 'generate';
        this.controls.record_button = document.createElement('button');
        this.controls.record_button.className = 'controls-element ' + this.prefix + 'record-button';
        this.controls.record_button.innerText = 'rec';
        this.controls.stop_button = document.createElement('button');
        this.controls.stop_button.className = 'controls-element ' + this.prefix + 'stop-button';
        this.controls.stop_button.innerText = 'stop';
        this.controls.save_config_button = document.createElement('button');
        this.controls.save_config_button.className = 'controls-element ' + this.prefix + 'save-config-button';
        this.controls.save_config_button.innerText = 'save config';

        /* inputs */
        this.controls.duration_input = document.createElement('input');
        this.controls.duration_input.className = 'controls-element ' + this.prefix + 'duration-input';
        this.controls.duration_input.placeholder = `duration (${this.config['duration'] === -1 ? 'none' : this.config['duration'] / 1000 + ' sec'})`;
        this.controls.delay_input = document.createElement('input');
        this.controls.delay_input.className = 'controls-element ' + this.prefix + 'delay-input';
        this.controls.delay_input.placeholder = `delay (${this.config['delay'] / 1000} sec)`;
        this.controls.width_input = document.createElement('input');
        this.controls.width_input.className = 'controls-element ' + this.prefix + 'width-input';
        this.controls.width_input.placeholder = `width (current: ${this.config['width']}px)`;
        this.controls.height_input = document.createElement('input');
        this.controls.height_input.className = 'controls-element ' + this.prefix + 'height-input';
        this.controls.height_input.placeholder = `height (current: ${this.config['height']}px)`;

        this.controls.countdown = document.createElement('div');
        this.controls.countdown.className = 'controls-element ' + this.prefix + 'countdown';
        this.controls.countdown.innerText = this.config['delay'];

        this.container.appendChild(this.controls.generate_button);
        this.container.appendChild(this.controls.record_button);
        this.container.appendChild(this.controls.stop_button);
        this.container.appendChild(this.controls.duration_input);
        this.container.appendChild(this.controls.delay_input);
        this.container.appendChild(this.controls.width_input);
        this.container.appendChild(this.controls.height_input);
        this.container.appendChild(this.controls.save_config_button);
        this.container.appendChild(this.controls.countdown);
        document.body.appendChild(this.container);
    }
    addListeners(){
        this.controls.generate_button.onclick = this.generate.bind(this);
        this.controls.record_button.onclick = this.initRecord.bind(this);
        this.controls.stop_button.onclick = () => {
            this.stop(false);
        };
        this.controls.save_config_button.onclick = this.saveConfig.bind(this);
        this.controls.duration_input.oninput = ()=>{
            this.config['duration'] = this.controls.duration_input.value;
        };
        this.controls.delay_input.oninput = ()=>{
            this.config['delay'] = this.controls.delay_input.value * 1000;
        };
        this.controls.width_input.oninput = ()=>{
            this.config['width'] = this.controls.width_input.value;
        };
        this.controls.height_input.oninput = ()=>{
            this.config['height'] = this.controls.height_input.value;
        };

        window.addEventListener('keydown', (e)=>{
            if(e.key !== ' ') return;
            e.preventDefault();
            if(this.status == -1) {
                this.initRecord();
            }else if(this.status == 1) {
                this.stop();
            }
        });
    }
    updateStatus(code){
        /* 
            -2: pending
            -1: ready
            0: stop
            1: recording
            2: counting down
        */
        this.status = code;
        this.container.setAttribute('data-status', this.status);
    }
    loadStylesheets(){
        const css_id = this.prefix + 'style';  // you could encode the css path itself to generate id..
        if (!document.getElementById(css_id))
        {
            const head  = document.getElementsByTagName('head')[0];
            const link  = document.createElement('link');
            link.id   = css_id;
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = '/static/css/documentator-recorder.css';
            link.media = 'all';
            head.appendChild(link);
        }
    }
    generate(){
        // console.log('generate');
        let params = [];
        for(const name in this.config) {
            params.push(`${this.prefix + name}=${this.config[name]}`);
        }
        params.push(this.prefix + 'status=-1')
        params = params.join('&');
        // console.log(params);
        let url = window.location.search ? window.location.href + '&' + params : window.location.href + '?' + params;
        // console.log(url);
        // let extra = this.config['viewportOnly'] ? `innerWidth=${this.config['width']},innerHeight=${this.config['height']}` : `width=${this.config['width']},height=${this.config['height']}`;
        let extra = `width=${this.config['width']},height=${this.config['height']}`;
        let w = window.open(url, '_blank', extra);
    }
    async initRecord(){
        console.log('initRecord');
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => {
            this.chunks.push(e.data);
        };
        this.mediaRecorder.onstart = ()=>{
            this.updateStatus(1);
        }
        this.mediaRecorder.onstop = this.saveVideo.bind(this);
        console.log(this.config['delay']);
        if(this.config['delay'] !== 0) {
            this.countDown();
        } else {
            this.record();
        }
        
    }
    record() {
        console.log('record');
        this.mediaRecorder.start();
        if(this.config['duration'] > 0) {
            this.timer = setTimeout(()=>{
                this.stop();
            }, this.config['duration']);
        }
    }
    
    stop(save=true) {
        if(this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.updateStatus(-1);
        this.mediaRecorder.stop();
    }
    countDown(count=false){
        console.log('countDown: ', count);
        this.updateStatus(2);
        let current = count === false ? parseInt(this.config['delay']) / 1000 : count;
        console.log(this.config['delay']);
        console.log(current);
        this.controls.countdown.innerText = current;
        if(current === 0) {
            this.timer = setTimeout(()=>{
                this.record();
            }, 1000);
        }
        else {
            this.timer = setTimeout(()=>{
                console.log(current - 1);
                this.countDown(current - 1);
            }, 1000);
        }
    }
    saveVideo(){
        const self = this;
        const blob = new Blob(self.chunks, { type: 'video/webm' });
        const formData = new FormData();

        // Append the Blob to the FormData object
        formData.append('video', blob, 'recording.webm');
        // formData.append('heightToCrop', (window.outerHeight - window.innerHeight));
        // formData.append('heightToCrop', 0);
        formData.append('videoWidth', window.innerWidth);
        formData.append('videoHeight', window.innerHeight);
        console.log('saveVideo()');
        // Send the Blob to the PHP backend
        fetch('/pageRecorder/php/videoHandler.php', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(result => {
            console.log('Success:', result);
            this.chunks = [];
        })
        .catch(error => {
            console.error('Error:', error);
        });
        
    }
    saveConfig(){
        let self = this;
        chrome.storage.sync.set(self.config, () => {
            // Notify the user that the options were saved
            alert('Settings saved');
        });
    }
}
