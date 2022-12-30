// ==UserScript==
// @name         青书学堂视频挂机
// @namespace    https://github.com/lanomw
// @version      1.0
// @description  青书学堂视频自动静音播放，解放双手。支持自动播放视频、作业答案自动填入
// @author       lanomw
// @match        *://*.qingshuxuetang.com/*
// @icon         https://degree.qingshuxuetang.com/resources/default/images/favicon.ico
// @require      https://unpkg.com/pxmu@1.1.0/dist/web/pxmu.min.js
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict'

    setTimeout(function () {
        // 看网课
        if (location.href.indexOf('cw_nodeId') !== -1) {
            autoPlayVideo()
        }

        // 做作业
        if (location.href.indexOf('ExercisePaper') !== -1) {
            autoFillAnswer()
        }
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

// 自动播放视频
function autoPlayVideo() {
    const urlSearch = UrlSearch()

    // 当前id
    const cw_nodeId = `
courseware -${urlSearch.cw_nodeId}`
    // 课程列表
    const lessonList = document.getElementById('lessonList').children
    // 下一个课程
    const next_cw_nodeId = getNextLession(lessonList, cw_nodeId)

    const video = document.getElementsByTagName("video")[0]
    // 静音、倍速
    video.muted = true
    // 设置倍速播放 支持以下速率: [2, 1.5, 1.2, 0.5]
    video.playbackRate = 2
    video.play()

    // 视频播放结束则跳转
    video.addEventListener("ended", function () {
        if (next_cw_nodeId) {
            const lession = document.getElementById(next_cw_nodeId)
            lession && lession.click()
        }
    })
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
                    continue
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

// 答案自动填入
function autoFillAnswer() {
    var urlSearch = UrlSearch()

    fetch(`
https://degree.qingshuxuetang.com/xnsy/Student/DetailData?_t=${new Date().getMilliseconds()}&quizId=${urlSearch.quizId}`, {
        method: 'GET',
        headers: {
            Host: 'degree.qingshuxuetang.com',
            Cookie: Object.entries(Cookies.get()).map(([key, value]) => `${key}=${value}`).join('; '),
            Referer: `https://degree.qingshuxuetang.com/xnsy/Student/ExercisePaper?courseId=${urlSearch.courseId}&quizId=${urlSearch.quizId}&teachPlanId=${urlSearch.teachPlanId}&periodId=${urlSearch.periodId}`,
            'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': 'macOS',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
        },
    }).then(res => res.json()).then(res => {
        var questions = res.data.paperDetail.questions

        Object.values(questions).forEach(item => {
            // 处理单选/多选 答案填入
            for (let i = 0; i < item.solution.length; i++) {
                $(`#${item.questionId}_${item.solution.charAt(i)}`).click()
            }
        })

        pxmu.success({
            msg: '答案已自动填入',
            bg: '#4CC443',
        })
    }).catch(err => {
        pxmu.fail({
            msg: '答案已填入失败。请手动填入答案',
            bg: 'red',
        })

        setTimeout(() => {
            // 异常则直接打开答案查看页面。窗口可能会被浏览器拦截。需要允许
            window.open(location.href.replace('ExercisePaper', 'ViewQuiz'), '_blank')
        }, 1500)

        console.error(err)
    });
}