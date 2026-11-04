import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** 页面级兜底：渲染异常留痕，并给用户一个恢复出口。 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[react-error ${new Date().toISOString()}]`, error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="crash">
          <div className="crash__card">
            <span className="crash__icon">
              <AlertCircle size={26} />
            </span>
            <h1>页面出了点问题</h1>
            <p>错误已记录到浏览器控制台，刷新后可继续使用。</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
