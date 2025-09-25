// LIFF ID ของคุณ (2008162847-jMMzgOn1)
const liffId = '2008162847-jMMzgOn1';

// อัปเดตสถานะในหน้าเว็บ
function updateStatus(elementId, message, color = 'black') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.color = color;
    }
}

// ฟังก์ชันหลัก: เริ่มต้น LIFF และทดสอบ Login
async function initializeLiff() {
    updateStatus('liff-id-display', liffId);
    
    try {
        updateStatus('liff-status', 'กำลังเริ่มต้น...', 'blue');
        
        // ตรวจสอบว่าอยู่ใน LINE app หรือไม่
        const isInLineApp = liff.isInClient();
        console.log('Running in LINE app:', isInLineApp);
        
        // 1. เริ่มต้น LIFF
        console.log('Initializing LIFF with ID:', liffId);
        await liff.init({ liffId: liffId });
        updateStatus('liff-status', '✅ โหลดและเริ่มต้นสำเร็จ', 'green');
        console.log('LIFF initialized successfully');

        // 2. ตรวจสอบสถานะการล็อกอิน
        updateStatus('login-status', 'กำลังตรวจสอบ...', 'blue');
        console.log('Checking login status...');
        
        if (!liff.isLoggedIn()) {
            updateStatus('login-status', 'ไม่พบการล็อกอิน, กำลัง Redirect...', 'orange');
            console.log('User not logged in, redirecting to login...');
            // สั่งล็อกอิน: LIFF จะ Redirect ไปหน้า LINE Login
            liff.login();
        } else {
            updateStatus('login-status', '✅ ล็อกอินแล้ว', 'green');
            console.log('User is logged in, getting profile...');
            
            // 3. ดึง Profile
            const profile = await liff.getProfile();
            console.log('Profile retrieved:', profile);
            
            // 4. แสดงข้อมูล Profile
            document.getElementById('profile-container').style.display = 'block';
            document.getElementById('profile-picture').src = profile.pictureUrl;
            document.getElementById('display-name').textContent = profile.displayName;
            document.getElementById('user-id').textContent = profile.userId;

            // ซ่อนส่วนสถานะเมื่อล็อกอินสำเร็จ
            document.getElementById('status-box').style.display = 'none';
        }
    } catch (err) {
        // จัดการ Error ที่เกิดขึ้น
        updateStatus('liff-status', '🔴 ล้มเหลว', 'red');
        let errMsg = 'LIFF init ล้มเหลว';
        if (err && err.message) {
            errMsg += `: ${err.message}`;
        } else {
            errMsg += '. ตรวจสอบ Console และการตั้งค่า Domain';
        }
        updateStatus('error-message', errMsg, 'red');
        console.error('🔴 LIFF initialization failed', err);
        console.error('Error details:', err);
    }
}

// รอให้ DOM โหลดเสร็จก่อนเรียก initializeLiff()
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page DOM content loaded, attempting to initialize LIFF...');
    
    // ตรวจสอบว่า liff ถูกกำหนดค่าแล้ว
    if (typeof liff !== 'undefined') {
        console.log('LIFF SDK found, initializing...');
        initializeLiff();
    } else {
        console.log('LIFF SDK not found, waiting for it to load...');
        // รอสักครู่แล้วลองใหม่
        setTimeout(() => {
            if (typeof liff !== 'undefined') {
                console.log('LIFF SDK loaded after delay, initializing...');
                initializeLiff();
            } else {
                // หากยังไม่ได้ แสดงว่ามีปัญหา Network Blocking หรือไม่ได้เปิดใน LINE app
                updateStatus('liff-status', '🔴 SDK โหลดไม่สำเร็จ', 'red');
                
                // ตรวจสอบว่าอยู่ใน LINE app หรือไม่
                const isInLineApp = navigator.userAgent.toLowerCase().includes('line');
                if (!isInLineApp) {
                    updateStatus('error-message', '⚠️ กรุณาเปิดใน LINE app เท่านั้น! LIFF ทำงานได้เฉพาะใน LINE app', 'orange');
                    updateStatus('login-status', '❌ ไม่สามารถทดสอบได้', 'red');
                } else {
                    updateStatus('error-message', 'LIFF SDK ถูกบล็อก: ตรวจสอบ Ad Blocker/Network และ Callback URL ใน Console', 'red');
                }
                console.error('LIFF SDK failed to load or is blocked. Check network connection.');
            }
        }, 3000);
    }
});