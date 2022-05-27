// ==UserScript==
// @name         青书学堂视频挂机
// @namespace    https://github.com/lanomw
// @version      0.1
// @description  青书学堂视频自动静音播放，解放双手。目前仅支持视频自动播放
// @author       lanomw
// @match        *://*.qingshuxuetang.com/*
// @icon         https://degree.qingshuxuetang.com/resources/default/images/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 非播放页面阻断执行
    if (location.href.indexOf('cw_nodeId') === -1) {
        return
    }

    setTimeout(function () {
        const urlSearch = UrlSearch()

        // 当前id
        const cw_nodeId = `courseware-${urlSearch.cw_nodeId}`
        // 课程列表
        const lessonList = document.getElementById('lessonList').children
        // 下一个课程
        const next_cw_nodeId = getNextLession(lessonList, cw_nodeId)


        const video = document.getElementsByTagName("video")[0]
        // 静音、倍速
        video.muted = true
        // 设置倍速播放 支持以下速率: [2, 1.5, 1.2, 0.5] ；默认开启 如有问题请手动注释下面这行代码；或者邮箱反馈我
        video.playbackRate = 2
        video.play()

        // 视频播放结束则跳转
        console.log(cw_nodeId, '---> to -->', next_cw_nodeId)
        video.addEventListener("ended", function () {
            if (next_cw_nodeId) {
                const lession = document.getElementById(next_cw_nodeId)
                lession && lession.click()
            }
        })
    }, 3000)

})();

// url参数转换为对象
function UrlSearch() {
    const search = location.search.replace('?', '')
    const params = {}
    const arr = search.split('&')
    arr.forEach(item => {
        const pArr = item.split('=')
        params[pArr[0]] = pArr[1]
    })

    return params
}

// 根据当前课程id递归获取下一个课程
function getNextLession(list, cw_nodeId) {
    let nodeId = ''
    let isMatch = false


    function findLession(list) {
        for (let i = 0; i < list.length; i++) {
            const children = list[i].children
            const childElementCount = list[i].childElementCount
            if (childElementCount === 1) {
                // 下一个课程
                if (isMatch) {
                    nodeId = children[0].id
                    break
                }

                // 已匹配到当前课程。获取下一个课程
                if (children[0].id === cw_nodeId) {
                    isMatch = true
                    continue;
                }
            } else {
                // 递归
                findLession(children[1].children)
                if (nodeId && isMatch) {
                    break
                }
            }
        }

        return {nodeId, isMatch}
    }

    findLession(list)

    return nodeId
}
