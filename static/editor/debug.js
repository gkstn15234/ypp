// GitHub 토큰 상태 확인
console.log('GitHub 토큰 상태 확인:');
console.log('저장된 토큰:', localStorage.getItem('github-token') ? '존재함' : '없음');
console.log('토큰 길이:', localStorage.getItem('github-token')?.length || 0);

// 토큰 유효성 테스트
async function testGitHubToken() {
    const token = localStorage.getItem('github-token');
    if (!token) {
        console.log('❌ GitHub 토큰이 없습니다.');
        return;
    }

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            const user = await response.json();
            console.log('✅ GitHub 토큰이 유효합니다.');
            console.log('사용자:', user.login);
            console.log('권한:', response.headers.get('X-OAuth-Scopes'));
        } else {
            console.log('❌ GitHub 토큰이 유효하지 않습니다.');
            console.log('응답 상태:', response.status);
            console.log('응답 메시지:', response.statusText);
        }
    } catch (error) {
        console.log('❌ GitHub API 호출 오류:', error);
    }
}

// 토큰 테스트 실행
testGitHubToken(); 