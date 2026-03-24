import { useEffect, useMemo, useRef, useState } from 'react'
import { login, register } from './api/auth'
import { Toast, type ToastState } from './components/Toast'

type AuthMode = 'login' | 'register'

interface CopyContent {
  heroTitle: string
  formTitle: string
  formSubtitle: string
  hint: string
  button: string
  footPrefix: string
  footAction: string
}

const contentMap: Record<AuthMode, CopyContent> = {
  login: {
    heroTitle: '先登录，再进入你的工作空间。',
    formTitle: '欢迎回来',
    formSubtitle: '使用你的 mono 账号登录',
    hint: '登录成功后会先给出成功提示，页面跳转在后续业务开发阶段再接入。',
    button: '登录',
    footPrefix: '还没有账号？',
    footAction: '立即注册',
  },
  register: {
    heroTitle: '创建账号，进入 mono 的受保护体验。',
    formTitle: '创建你的账号',
    formSubtitle: '仅需几步，即可进入登录后的工作页面',
    hint: '注册成功后只弹提示，不立即跳转，便于后续按真实业务再接页面流转。',
    button: '创建账号',
    footPrefix: '已经有账号？',
    footAction: '去登录',
  },
}

function validate(mode: AuthMode, account: string, password: string) {
  const cleanedAccount = account.trim()
  const cleanedPassword = password.trim()

  if (!cleanedAccount) {
    return '请输入账号'
  }

  if (!cleanedPassword) {
    return '请输入密码'
  }

  if (mode === 'register' && cleanedPassword.length < 8) {
    return '注册密码至少需要 8 位字符'
  }

  return ''
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [transitionStage, setTransitionStage] = useState<'idle' | 'leaving' | 'entering'>('idle')
  const switchTimerRef = useRef<number | null>(null)
  const enterTimerRef = useRef<number | null>(null)

  const copy = useMemo(() => contentMap[mode], [mode])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) {
        window.clearTimeout(switchTimerRef.current)
      }

      if (enterTimerRef.current) {
        window.clearTimeout(enterTimerRef.current)
      }
    }
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = validate(mode, account, password)
    if (message) {
      setToast({ type: 'error', message })
      return
    }

    if (mode === 'register' && !agree) {
      setToast({ type: 'error', message: '请先确认服务条款与隐私说明' })
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'login') {
        await login({
          account: account.trim(),
          password,
        })

        setToast({ type: 'success', message: '登录成功，接口联调已通过。' })
      } else {
        await register({
          account: account.trim(),
          password,
        })

        setToast({ type: 'success', message: '注册成功，当前先保留在本页提示。' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败，请稍后再试'
      setToast({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  function handleModeChange(nextMode: AuthMode) {
    if (nextMode === mode || transitionStage === 'leaving') {
      return
    }

    setToast(null)
    setTransitionStage('leaving')

    if (switchTimerRef.current) {
      window.clearTimeout(switchTimerRef.current)
    }

    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current)
    }

    switchTimerRef.current = window.setTimeout(() => {
      setMode(nextMode)
      setTransitionStage('entering')

      enterTimerRef.current = window.setTimeout(() => {
        setTransitionStage('idle')
      }, 260)
    }, 170)
  }

  return (
    <div className={`app app--${mode}`}>
      <Toast toast={toast} />
      <header className="topbar">
        <div className="brand">mono</div>
        <div className="mode-switch" aria-label="认证模式切换">
          <button
            className={mode === 'login' ? 'mode-switch__item is-active' : 'mode-switch__item'}
            onClick={() => handleModeChange('login')}
            type="button"
          >
            登录
          </button>
          <button
            className={mode === 'register' ? 'mode-switch__item is-active' : 'mode-switch__item'}
            onClick={() => handleModeChange('register')}
            type="button"
          >
            注册
          </button>
        </div>
      </header>

      <main className="hero">
        <section className={`hero__intro auth-stage auth-stage--${transitionStage}`}>
          <h1>{copy.heroTitle}</h1>
          <div className="hero__logo" aria-label="mono brand logo">
            <span className="hero__logoMark" />
            <span className="hero__logoText">mono</span>
          </div>
        </section>

        <section className={`hero__panel auth-stage auth-stage--${transitionStage}`}>
          <form className="auth-card" onSubmit={handleSubmit}>
            <div className="auth-card__heading">
              <h2>{copy.formTitle}</h2>
              <p>{copy.formSubtitle}</p>
            </div>

            <label className="field">
              <span className="field__label">账号</span>
              <input
                autoComplete="username"
                className="field__control"
                name="account"
                onChange={(event) => setAccount(event.target.value)}
                placeholder={mode === 'login' ? '请输入 account' : '设置你的 account'}
                value={account}
              />
            </label>

            <label className="field">
              <span className="field__label">密码</span>
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="field__control"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'login' ? '请输入密码' : '至少 8 位字符'}
                type="password"
                value={password}
              />
            </label>

            {mode === 'login' ? (
              <div className="meta-row">
                <span>忘记密码？</span>
                <span className="meta-row__link">需要帮助</span>
              </div>
            ) : (
              <label className="agreement">
                <input
                  checked={agree}
                  onChange={(event) => setAgree(event.target.checked)}
                  type="checkbox"
                />
                <span>我已阅读并同意服务条款与隐私说明</span>
              </label>
            )}

            <button className="submit-button" disabled={submitting} type="submit">
              {submitting ? '提交中...' : copy.button}
            </button>

            <div className="foot-switch">
              <span>{copy.footPrefix}</span>
              <button
                className="foot-switch__action"
                onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
                type="button"
              >
                {copy.footAction}
              </button>
            </div>

            <div className="auth-tip">
              <p>{copy.hint}</p>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}
