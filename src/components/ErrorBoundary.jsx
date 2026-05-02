import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <h3 style={{ color: '#e74c3c', marginBottom: '8px' }}>页面出错了</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#FF7B70',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
