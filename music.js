function Music() {

    this.index = 0
    this.init()
    //创建播放器
    this.audio = new Audio()
    this.audio.volume = 0.5
    this.bindEvents()
    this.getAllAblums()
    this.loadMusic = true
    this.loadFirst = false
}
Music.prototype.getAllAblums = function () {
    var _this = this
    //获取所有专辑
    this.get('http://api.jirengu.com/fm/getChannels.php', {}, function (ret) {
        //设置全局专辑数组
        _this.ablums = ret.channels
        _this.parseAblum(ret.channels[0])
        _this.setTitle(this.index)

    })
}
//初始化数据
Music.prototype.init = function () {
    //当前专辑
    this.currentAlbum = this.getDom('.album')
    //上一个专辑名字
    this.preAlbum = this.getDom('.music-type')
    //下一个专辑名字
    this.nextAlbum = this.getDom('.year')
    //歌曲图片
    this.img = this.getDom('.content>img')
    //歌曲作者
    this.songAuthor = this.getDom('.name1')
    //歌曲作者
    this.songName = this.getDom('.name2')
    //下一首随机歌曲
    this.nextSong = this.getDom('.function .next')
    //获取暂停/创建播放器
    this.pause = this.getDom('.function .play-pause')
    //上一个专辑
    this.preAblumBtn = this.getDom('header>.before')
    //下一个专辑
    this.nextAblumBtn = this.getDom('header>.after')
    //获取开始时间
    // this.time1 = this.getDom('.start')
    //获取结束时间
    this.time2 = this.getDom('.end')
    //颜色进度条
    this.colorProgress = this.getDom('.music-color')
    //点击音量大小
    this.volumeProgress = document.querySelectorAll('.volume-progress>div')
    //灰色进度条
    this.grayProgress = this.getDom('.music-progress')
    //音量调节滑块
    this.volumeSlider = this.getDom('.volume>input')
    //获取歌词
    this.lyric = this.getDom('.lyric')
    //小圆圈
    this.cycle = this.getDom('.cycle')
}
Music.prototype.getDom = function (selector) {
    return document.querySelector(selector)
}
//设置文字
Music.prototype.setTitle = function () {
    //设置当前专辑名字
    this.currentAlbum.innerText = this.ablums[this.index].name

    //设置上一个
    var preIndex
    if (this.index - 1 < 0) {
        preIndex = this.ablums.length - 1
    } else {
        preIndex = this.index - 1
    }
    this.preAlbum.innerText = this.ablums[preIndex].name


    //设置下一个
    var nextIndex
    if (this.index + 1 > this.ablums.length - 1) {
        nextIndex = 0
    } else {
        nextIndex = this.index + 1
    }
    this.nextAlbum.innerText = this.ablums[nextIndex].name
}
Music.prototype.get = function (url, data, callback, dataType) {
    url += '?' + Object.keys(data).map(function (key) {
        return key + '=' + data[key]
    }).join('&')
    var xhr = new XMLHttpRequest()
    xhr.responseType = dataType || 'json'
    xhr.onload = function () {
        callback(xhr.response)
    }
    xhr.open('GET', url, true)
    xhr.send()
}

//获取随机歌曲
Music.prototype.parseAblum = function (ablum) {
    this.audio.pause()
    var _this = this
    clearInterval(_this.timer)
    clearInterval(_this.timer2)
    // _this.time1.innerText = '--:--'
    _this.time2.innerText = '--:--'
    //设置进度条
    this.colorProgress.style.width = '0px'
    this.isProgress = false
    
    //获取随机歌曲
    this.get('http://api.jirengu.com/fm/getSong.php', { channel: ablum.channel_id }, function (ret) {
        _this.loadMusic = true
        _this.loadFirst = true
        _this.setSong(ret.song[0])

    })
}
//设置歌曲信息
Music.prototype.setSong = function (song) {
    //设置图片
    this.img.setAttribute('src', song.picture)

    //设置作者
    this.songAuthor.innerText = song.artist

    //设置歌曲名字
    this.songName.innerText = song.title

    this.audio.src = song.url
    this.audio.play()

    //获取歌词
    this.get('http://api.jirengu.com/fm/getLyric.php', { sid: song.sid },  (ret) => {

        this.lyricObj = parseLyric(ret.lyric)

    })

    function parseLyric(lrc) {
        var lyrics = lrc.split("\n");
        var lrcObj = {};
        for (var i = 0; i < lyrics.length; i++) {
            var lyric = decodeURIComponent(lyrics[i]);
            var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
            var timeRegExpArr = lyric.match(timeReg);
            if (!timeRegExpArr) continue;
            var clause = lyric.replace(timeReg, '');
            for (var k = 0, h = timeRegExpArr.length; k < h; k++) {
                var t = timeRegExpArr[k];
                var min = Number(String(t.match(/\[\d*/i)).slice(1)),
                    sec = Number(String(t.match(/\:\d*/i)).slice(1));
                var time = min * 60 + sec;
                lrcObj[time] = clause;
            }
        }
        return lrcObj;
    }
}
Music.prototype.createTimer2 = function () {
    clearInterval(this.timer2)
    let min = parseInt(this.duration / 60)
    let second = parseInt(this.duration % 60)
    let currentM
    let currentS
    if (min < 10) {
        currentM = '0' + min
    } else {
        currentM = min
    }
    if (second < 10) {
        currentS = '0' + second
    } else {
        currentS = second
    }
    this.timer2 = setInterval(() => {
        this.duration--
        min = parseInt(this.duration / 60)
        second = parseInt(this.duration % 60)
        if (min < 10) {
            currentM = '0' + min
        } else {
            currentM = min
        }
        if (second < 10) {
            currentS = '0' + second
        } else {
            currentS = second
        }
        this.time2.innerText = '-' + currentM + ':' + currentS
    }, 1000)
}
Music.prototype.createTimer = function () {
    this.second = 0
    this.min = 0
    this.currentTimeS = 0
    this.currentTimeF = '00'
    clearInterval(this.timer)
    this.timer = setInterval(() => {
        this.second++;
        if (this.second < 10) {
            this.currentTimeS = '0' + this.second
        } else if (this.second < 60) {
            this.currentTimeS = this.second
        } else {
            this.second = 0
            this.currentTimeS = '00'
            this.min++
            if (this.min < 10) {
                this.currentTimeF = '0' + this.min
            } else {
                this.currentTimeF = this.min
            }
        }
        // this.time1.innerText = this.currentTimeF + ':' + this.currentTimeS
        this.progress += 180 / this.durationFix
        this.colorProgress.style.width = this.progress + 'px'
        this.cycle.style.left = this.progress-5  + 'px'
    }, 1000)
}
//绑定事件
Music.prototype.bindEvents = function () {
    var _this = this
    //下一首歌曲
    this.nextSong.addEventListener('click', function () {
        if (!_this.loadFirst) {
            return
        }
        _this.parseAblum(_this.ablums[0])
    })

    //暂停
    this.pause.addEventListener('click', function () {
        if (!_this.loadFirst) {
            return
        }
        if (_this.audio.paused) {
            _this.audio.play()
            _this.pause.innerHTML = '&#xe646'
            _this.createTimer()
            _this.createTimer2()
            
        } else {
            clearInterval(_this.timer)
            clearInterval(_this.timer2)
            _this.audio.pause()
            _this.pause.innerHTML = '&#xe645'
            
        }


    })
    //播放完成
    this.audio.addEventListener('ended', () => {
        this.canPlay = false
        this.parseAblum(_this.ablums[0])
    })

    //上一张专辑
    this.preAblumBtn.addEventListener('click', function () {
        if (!_this.loadFirst) {
            return
        }
        if (!_this.loadMusic) {
            return
        }
        _this.loadMusic = false
        _this.index--
        if (_this.index < 0) {
            _this.index = _this.ablums.length - 1
        }
        _this.setTitle()
        _this.parseAblum(_this.ablums[_this.index])

    })
    //下一张专辑
    this.nextAblumBtn.addEventListener('click', function () {
        if (!_this.loadFirst) {
            return
        }
        if (!_this.loadMusic) {
            return
        }
        _this.loadMusic = false
        _this.index++
        if (_this.index > _this.ablums.length - 1) {
            _this.index = 0
        }
        _this.setTitle()
        _this.parseAblum(_this.ablums[_this.index])
    })

    //music下载

    this.audio.addEventListener('canplay', () => {
        if (this.isProgress) {
            this.duration = (1 - this.baifenbi) * this.durationFix
            this.progress = 180 * this.baifenbi
        } else {
            this.duration = parseInt(this.audio.duration)
            this.durationFix = parseInt(this.audio.duration)
            this.progress = 0
        }
        //设置结束计时器
        this.createTimer2()

        //设置开始计时器
        this.createTimer()
        this.canPlay = true
    })

    //调节音量
    this.arr = []
    for (let i = 0; i < this.volumeProgress.length; i++) {
        let volume = this.volumeProgress[i]
        volume.addEventListener('click', (e) => {
            //设置active
            let index = [].indexOf.call(this.volumeProgress, e.target)

            if (index === 0) {
                this.volumeSlider.value = 1 * 10
                //保存音量数组
                this.arr = [0, 1, 2, 3]
            } else if (index === 1) {
                this.volumeSlider.value = 0.75 * 10
                this.arr = [1, 2, 3]
            } else if (index === 2) {
                this.arr = [2, 3]
                this.volumeSlider.value = 0.5 * 10
            } else if (index === 3) {

                if (this.arr.toString() == [3].toString()) {
                    this.volumeBlock(index, 3)
                    this.arr = []
                    return;
                }
                this.arr = [3]
                this.volumeSlider.value = 0.25 * 10
            }
            this.volumeBlock(index)
        })
    }

    //进度条事件
    this.grayProgress.addEventListener('click', (e) => {

        if (!this.canPlay) {
            return
        }
        let x = e.pageX;
        let y = offset(this.grayProgress).left;
        this.colorProgress.style.width = x - y + 200 + 'px'
        this.cycle.style.left = x - y + 200-5  + 'px'
        this.baifenbi = (x - y + 200) / 180
        this.audio.currentTime = this.baifenbi * this.durationFix
        this.isProgress = true
    })
    function offset(curEle) {
        var totalLeft = null, totalTop = null, par = curEle.offsetParent;
        //首先把自己本身的进行累加
        totalLeft += curEle.offsetLeft;
        totalTop += curEle.offsetTop;

        //只要没有找到body，我们就把父级参照物的边框和偏移量累加
        while (par) {
            if (navigator.userAgent.indexOf("MSIE 8.0") === -1) {
                //不是标准的ie8浏览器，才进行边框累加
                //累加父级参照物边框
                totalLeft += par.clientLeft;
                totalTop += par.clientTop;
            }
            //累加父级参照物本身的偏移
            totalLeft += par.offsetLeft;
            totalTop += par.offsetTop;
            par = par.offsetParent;
        }
        return { left: totalLeft, top: totalTop };
    }

    //音量滑块
    this.volumeSlider.addEventListener('change', (e) => {
        this.audio.volume = e.target.value / 10
        if (this.audio.volume === 0) {
            this.volumeBlock(3, 3)
        }
        else if (this.audio.volume <= 0.25) {
            this.volumeBlock(3)
            this.arr = [3]
        } else if (this.audio.volume <= 0.5) {
            this.volumeBlock(2)
            this.arr = [2, 3]
        } else if (this.audio.volume <= 0.75) {
            this.volumeBlock(1)
            this.arr = [1, 2, 3]
        } else if (this.audio.volume <= 1) {
            this.volumeBlock(0)
            this.arr = [0, 1, 2, 3]
        }
    })

    //监听更新，取出对应歌词
    this.shouldUpdate = true
    this.audio.ontimeupdate = () => {
        
        if (this.shouldUpdate) {
            //do something
            let second = (this.durationFix - this.duration)
            for(key in this.lyricObj){
                
                if(parseInt(key)<=second){
                    this.lyIndex = key
                    // console.log(second)
                }
                if(parseInt(key)>second){
                    break;
                }
            }
            // console.log(this.lyIndex,this.lyricObj)
            // let lySecond = this.lyricObj[this.lyIndex + 1]
            // if (second <= lySecond) {
                this.lyric.innerText = this.lyricObj[this.lyIndex]
            // } else {
            //     this.lyric.innerText = this.lyricObj[this.lyricObj[this.lyIndex + 1]]
            //     this.lyIndex++;
            // }
            // console.log(this.lyIndex)
            this.shouldUpdate = false
            setTimeout(() => {
                this.shouldUpdate = true
            }, 1000)
        }
    }

}

//音量事件
Music.prototype.volumeBlock = function (index, deletee) {
    for (let i = 0; i < this.volumeProgress.length; i++) {
        let volume = this.volumeProgress[i]
        volume.classList.remove('active')
    }
    if (deletee === 3) {
        this.audio.volume = 0
        this.volumeSlider.value = 0
        return
    }
    this.volumeProgress[index].classList.add('active')
    if (index === 3) {
        this.audio.volume = 0.25
    } else if (index === 2) {
        let volumee = this.volumeProgress[index + 1]
        volumee.classList.add('active')
        this.audio.volume = 0.5
    } else if (index === 1) {
        let volumee = this.volumeProgress[index + 2]
        volumee.classList.add('active')
        let volume = this.volumeProgress[index + 1]
        volume.classList.add('active')
        this.audio.volume = 0.75
    } else if (index === 0) {
        let volumee = this.volumeProgress[index + 3]
        volumee.classList.add('active')
        let volume = this.volumeProgress[index + 1]
        volume.classList.add('active')
        let volumeeee = this.volumeProgress[index + 2]
        volumeeee.classList.add('active')
        this.audio.volume = 1

    }
}
var music = new Music()