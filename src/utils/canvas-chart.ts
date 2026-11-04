/**
 * 统计页通用图表绘制（折线 / 柱状 / 雷达）
 *
 * 小程序端 Canvas 2D（type="2d"）与旧版 canvas 接口的方法名差异较大，
 * 这里用 ChartPen 做一层适配，绘图逻辑只维护一份，业务页只需传数据。
 *
 * 旧版接口没有真实画布尺寸，沿用改造前各页面固定的 300×150 坐标空间。
 */

import { nextTick } from 'vue'

// #region 类型定义

export interface ChartData {
  /** 数值数组，与 labels 一一对应 */
  values: number[]
  /** 轴标签 */
  labels: string[]
}

export interface ChartOptions {
  /** 页面实例，小程序 2d 场景下用于查询 canvas 节点 */
  instance?: any
  /** 折线图是否在数据点上方标注数值 */
  showValueLabels?: boolean
  /** 雷达图最少轴数，不足时按该值绘制，避免退化成一条线段 */
  minSides?: number
}

interface Prepared {
  pen: ChartPen
  width: number
  height: number
  /** 是否为 Canvas 2D 节点（false 表示旧版 canvas 接口） */
  is2d: boolean
}

interface CanvasSize {
  width: number
  height: number
}

// #endregion

// #region Canvas 绘制适配层

/**
 * 绘图笔：抹平 Canvas 2D 与旧版 canvas 接口的差异
 * - 颜色、线宽、字号等 setter 统一命名
 * - flush() 负责旧版接口的 ctx.draw() 提交
 */
class ChartPen {
  constructor(
    private readonly ctx: any,
    private readonly is2d: boolean
  ) {}

  clear(width: number, height: number) {
    this.ctx.clearRect(0, 0, width, height)
  }

  begin() {
    this.ctx.beginPath()
  }

  move(x: number, y: number) {
    this.ctx.moveTo(x, y)
  }

  line(x: number, y: number) {
    this.ctx.lineTo(x, y)
  }

  close() {
    this.ctx.closePath()
  }

  stroke() {
    this.ctx.stroke()
  }

  fill() {
    this.ctx.fill()
  }

  /** 画实心圆点 */
  circle(x: number, y: number, r: number) {
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, 2 * Math.PI)
  }

  rect(x: number, y: number, w: number, h: number) {
    this.ctx.fillRect(x, y, w, h)
  }

  text(content: string, x: number, y: number) {
    this.ctx.fillText(content, x, y)
  }

  setStroke(color: string) {
    if (this.is2d) this.ctx.strokeStyle = color
    else this.ctx.setStrokeStyle(color)
  }

  setFill(color: string | any) {
    if (this.is2d) this.ctx.fillStyle = color
    else this.ctx.setFillStyle(color)
  }

  setLineWidth(width: number) {
    if (this.is2d) this.ctx.lineWidth = width
    else this.ctx.setLineWidth(width)
  }

  setFont(size: number) {
    if (this.is2d) this.ctx.font = `${size}px sans-serif`
    else this.ctx.setFontSize(size)
  }

  linearGradient(x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
    const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1)
    stops.forEach(([position, color]) => gradient.addColorStop(position, color))
    return gradient
  }

  /** 旧版接口需要显式提交绘制指令；2d 接口为实时绘制 */
  flush() {
    if (!this.is2d) this.ctx.draw()
  }
}

// #endregion

// #region 画布获取

/** 旧版 canvas 接口使用的固定坐标空间（与改造前保持一致） */
const LEGACY_LINE_SIZE: CanvasSize = { width: 300, height: 150 }
const LEGACY_RADAR_SIZE: CanvasSize = { width: 300, height: 160 }

/** 节点查询重试次数与间隔：页面首屏较慢时 canvas 可能还没渲染出尺寸 */
const QUERY_RETRY = 15
const QUERY_INTERVAL = 80
/** 单次查询的超时保护：部分环境既不回调也不报错，避免整条渲染链被挂死 */
const QUERY_TIMEOUT = 120

interface CanvasNodeInfo {
  node: any
  width: number
  height: number
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 等待渲染队列，同时兜住 nextTick 异常/不回调的情况 */
async function waitRendered() {
  try {
    await Promise.race([nextTick(), sleep(QUERY_TIMEOUT)])
  } catch {
    await sleep(0)
  }
}

function readNode(res: any): CanvasNodeInfo | null {
  const first = res?.[0]
  const node = first?.node
  const width = first?.width
  const height = first?.height
  return node && width > 0 && height > 0 ? { node, width, height } : null
}

/**
 * 查询一次 canvas 节点
 * 先带页面/组件作用域查询；失败后回退到页面级查询（模块内调用时作用域可能失效）
 */
function queryCanvasNode(canvasId: string, instance: any): Promise<CanvasNodeInfo | null> {
  const scopes: any[] = []
  if (instance?.proxy) scopes.push(instance.proxy)
  if (instance && !instance.proxy) scopes.push(instance)
  // null 表示不调用 in()，使用页面级查询
  scopes.push(null)

  return new Promise((resolve) => {
    let index = 0
    let settled = false
    let timer: any

    const finish = (value: CanvasNodeInfo | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }

    const run = () => {
      if (settled) return
      if (index >= scopes.length) return finish(null)
      const scope = scopes[index++]
      // 每次查询单独计时，超时后换下一种查询方式
      clearTimeout(timer)
      timer = setTimeout(() => finish(null), QUERY_TIMEOUT)
      try {
        const query: any = uni.createSelectorQuery()
        if (scope) query.in(scope)
        query
          .select(`#${canvasId}`)
          .fields({ node: true, size: true }, () => {})
          .exec((res: any) => {
            if (settled) return
            const found = readNode(res)
            if (found) return finish(found)
            run()
          })
      } catch {
        run()
      }
    }

    run()
  })
}

/**
 * 查询 2d canvas 节点并初始化尺寸（含高倍屏适配）
 * @param canvasId canvas 节点 id
 * @param instance 页面实例
 */
async function prepare2d(canvasId: string, instance: any): Promise<Prepared | null> {
  for (let attempt = 0; attempt <= QUERY_RETRY; attempt++) {
    await waitRendered()
    const found = await queryCanvasNode(canvasId, instance)
    if (found) {
      try {
        const ctx = found.node.getContext('2d')
        const dpr = uni.getSystemInfoSync().pixelRatio || 1
        if (found.node.width !== found.width * dpr || found.node.height !== found.height * dpr) {
          found.node.width = found.width * dpr
          found.node.height = found.height * dpr
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        return {
          pen: new ChartPen(ctx, true),
          width: found.width,
          height: found.height,
          is2d: true
        }
      } catch (err) {
        console.warn(`[canvas-chart] 画布 ${canvasId} 初始化失败：`, err)
        return null
      }
    }
    if (attempt < QUERY_RETRY) await sleep(QUERY_INTERVAL)
  }
  console.warn(`[canvas-chart] 未查询到画布节点 #${canvasId}，图表未绘制`)
  return null
}

/**
 * 获取旧版 canvas 上下文
 */
function prepareLegacy(canvasId: string, size: CanvasSize): Prepared {
  const ctx = uni.createCanvasContext(canvasId)
  return { pen: new ChartPen(ctx, false), is2d: false, ...size }
}

/**
 * 按运行端准备画布：小程序走 2d 节点，其它端走旧版接口
 */
async function prepare(
  canvasId: string,
  options: ChartOptions,
  legacySize: CanvasSize
): Promise<Prepared | null> {
  let prepared: Prepared | null = null
  // #ifdef MP-WEIXIN
  prepared = await prepare2d(canvasId, options.instance)
  // #endif
  // #ifndef MP-WEIXIN
  prepared = prepareLegacy(canvasId, legacySize)
  // #endif
  return prepared
}

// #endregion

// #region 通用绘制片段

/**
 * 无数据占位
 */
function drawEmpty(pen: ChartPen, width: number, height: number) {
  pen.setFill('#999999')
  pen.setFont(12)
  pen.text('暂无数据', width / 2 - 24, height / 2)
}

/**
 * 年份轴标签：2024 → 24年
 */
export function shortYearLabel(year?: string | number | null): string {
  const value = String(year ?? '')
  return value.length >= 4 ? `${value.slice(2)}年` : value
}

// #endregion

// #region 折线图

/**
 * 绘制折线图（带渐变填充区域）
 * @param canvasId canvas 节点 id
 * @param data 数值与年份标签
 * @param options 绘制选项
 */
export async function renderLineChart(
  canvasId: string,
  data: ChartData,
  options: ChartOptions = {}
) {
  const prepared = await prepare(canvasId, options, LEGACY_LINE_SIZE)
  if (!prepared) return

  const { pen, width, height } = prepared
  const padding = 20
  const values = data.values

  pen.clear(width, height)
  if (!values.length) {
    drawEmpty(pen, width, height)
    pen.flush()
    return
  }

  const maxVal = Math.max(...values, 1)
  const stepX = values.length > 1 ? (width - 2 * padding) / (values.length - 1) : 0
  const pointAt = (i: number) => ({
    x: padding + i * stepX,
    y: height - padding - (values[i] / maxVal) * (height - 2 * padding)
  })

  // 网格线与 y 轴刻度
  pen.setStroke('#eeeeee')
  pen.setLineWidth(0.5)
  for (let i = 0; i <= 4; i++) {
    const y = height - padding - (i / 4) * (height - 2 * padding)
    pen.begin()
    pen.move(padding, y)
    pen.line(width - padding, y)
    pen.stroke()
    pen.setFill('#999999')
    pen.setFont(9)
    pen.text(String(Math.round((maxVal * i) / 4)), 4, y + 3)
  }

  // 渐变填充区域
  pen.begin()
  values.forEach((_, i) => {
    const p = pointAt(i)
    if (i === 0) pen.move(p.x, p.y)
    else pen.line(p.x, p.y)
  })
  pen.line(padding + (values.length - 1) * stepX, height - padding)
  pen.line(padding, height - padding)
  pen.close()
  pen.setFill(
    pen.linearGradient(0, padding, 0, height - padding, [
      [0, 'rgba(73, 154, 230, 0.2)'],
      [1, 'rgba(73, 154, 230, 0)']
    ])
  )
  pen.fill()

  // 折线
  pen.setStroke('#499AE6')
  pen.setLineWidth(2)
  pen.begin()
  values.forEach((_, i) => {
    const p = pointAt(i)
    if (i === 0) pen.move(p.x, p.y)
    else pen.line(p.x, p.y)
  })
  pen.stroke()

  // 数据点、数值与年份标签
  values.forEach((value, i) => {
    const p = pointAt(i)
    pen.setFill('#ffffff')
    pen.circle(p.x, p.y, 4)
    pen.fill()
    pen.setStroke('#499AE6')
    pen.stroke()

    if (options.showValueLabels) {
      const valueText = String(value)
      pen.setFill('#499AE6')
      pen.setFont(10)
      pen.text(valueText, p.x - valueText.length * 3, p.y - 8)
    }

    pen.setFill('#999999')
    pen.setFont(10)
    pen.text(data.labels[i] || '', p.x - 12, height - 5)
  })

  pen.flush()
}

// #endregion

// #region 柱状图

/**
 * 绘制柱状图
 * @param canvasId canvas 节点 id
 * @param data 数值与分类标签
 * @param options 绘制选项
 */
export async function renderBarChart(
  canvasId: string,
  data: ChartData,
  options: ChartOptions = {}
) {
  const prepared = await prepare(canvasId, options, LEGACY_LINE_SIZE)
  if (!prepared) return

  const { pen, width, height } = prepared
  const padding = { top: 20, right: 16, bottom: 30, left: 36 }

  pen.clear(width, height)
  if (!data.labels.length) {
    drawEmpty(pen, width, height)
    pen.flush()
    return
  }

  const maxVal = Math.max(...data.values, 1)
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const baseY = height - padding.bottom

  // 网格线与 y 轴刻度
  pen.setStroke('#eeeeee')
  pen.setLineWidth(0.5)
  for (let i = 0; i <= 4; i++) {
    const y = baseY - (i / 4) * chartH
    pen.begin()
    pen.move(padding.left, y)
    pen.line(width - padding.right, y)
    pen.stroke()
    pen.setFill('#999999')
    pen.setFont(9)
    pen.text(String(Math.round((maxVal * i) / 4)), 4, y + 3)
  }

  // 柱体、数值与 x 轴标签
  const slot = chartW / data.labels.length
  const barWidth = Math.min(slot * 0.5, 28)
  data.values.forEach((value, i) => {
    const barHeight = (value / maxVal) * chartH
    const x = padding.left + slot * i + (slot - barWidth) / 2
    const y = baseY - barHeight
    pen.setFill(
      pen.linearGradient(0, y, 0, baseY, [
        [0, '#499AE6'],
        [1, 'rgba(73, 154, 230, 0.4)']
      ])
    )
    pen.rect(x, y, barWidth, barHeight)

    pen.setFill('#333333')
    pen.setFont(9)
    pen.text(String(value), x + barWidth / 2 - 4, y - 4)

    const label = data.labels[i] || ''
    const display = label.length > 4 ? `${label.slice(0, 4)}…` : label
    pen.setFill('#999999')
    pen.setFont(9)
    pen.text(display, x + barWidth / 2 - display.length * 4, height - 8)
  })

  pen.flush()
}

// #endregion

// #region 雷达图

/**
 * 绘制雷达图
 * @param canvasId canvas 节点 id
 * @param data 各轴数值与名称
 * @param options 绘制选项（minSides 控制最少轴数）
 */
export async function renderRadarChart(
  canvasId: string,
  data: ChartData,
  options: ChartOptions = {}
) {
  const prepared = await prepare(canvasId, options, LEGACY_RADAR_SIZE)
  if (!prepared) return

  const { pen, width, height, is2d } = prepared
  const center = { x: width / 2, y: height / 2 }
  // 2d 按实际画布尺寸取半径；旧版接口沿用改造前固定的 55
  const radius = is2d ? Math.min(width, height) * 0.36 : 55
  const sides = Math.max(data.labels.length, options.minSides ?? data.labels.length, 3)
  const maxVal = Math.max(...data.values, 1)

  pen.clear(width, height)
  if (!data.labels.length) {
    drawEmpty(pen, width, height)
    pen.flush()
    return
  }

  // 背景网格
  pen.setStroke('#eeeeee')
  pen.setLineWidth(1)
  for (let ring = 1; ring <= 5; ring++) {
    pen.begin()
    const currentRadius = (radius / 5) * ring
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      const x = center.x + Math.cos(angle) * currentRadius
      const y = center.y + Math.sin(angle) * currentRadius
      if (i === 0) pen.move(x, y)
      else pen.line(x, y)
    }
    pen.close()
    pen.stroke()
  }

  // 数据区域
  pen.setFill('rgba(245, 166, 35, 0.3)')
  pen.setStroke('#F5A623')
  pen.begin()
  for (let i = 0; i < sides; i++) {
    const value = data.values[i] ?? 0
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
    const x = center.x + Math.cos(angle) * radius * (value / maxVal)
    const y = center.y + Math.sin(angle) * radius * (value / maxVal)
    if (i === 0) pen.move(x, y)
    else pen.line(x, y)
  }
  pen.close()
  pen.fill()
  pen.stroke()

  // 分类标签
  pen.setFill('#999999')
  pen.setFont(10)
  data.labels.forEach((label, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
    const x = center.x + Math.cos(angle) * (radius + 12)
    const y = center.y + Math.sin(angle) * (radius + 12)
    const textX = Math.min(Math.max(x - 12, 2), width - 4)
    const textY = Math.min(Math.max(y + 4, 10), height - 2)
    pen.text(label, textX, textY)
  })

  pen.flush()
}

// #endregion
