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
        
        // 1. เริ่มต้น LIFF
        await liff.init({ liffId: liffId });
        updateStatus('liff-status', '✅ โหลดและเริ่มต้นสำเร็จ', 'green');

        // 2. ตรวจสอบสถานะการล็อกอิน
        updateStatus('login-status', 'กำลังตรวจสอบ...', 'blue');
        if (!liff.isLoggedIn()) {
            updateStatus('login-status', 'ไม่พบการล็อกอิน, กำลัง Redirect...', 'orange');
            // สั่งล็อกอิน: LIFF จะ Redirect ไปหน้า LINE Login
            liff.login();
        } else {
            updateStatus('login-status', '✅ ล็อกอินแล้ว', 'green');
            
            // 3. ดึง Profile
            const profile = await liff.getProfile();
            
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
    }
}

// รอให้ DOM โหลดเสร็จก่อนเรียก initializeLiff()
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page DOM content loaded, attempting to initialize LIFF...');
    
    // ตรวจสอบว่า liff ถูกกำหนดค่าแล้ว
    if (typeof liff !== 'undefined') {
        initializeLiff();
    } else {
        // หากยังไม่ได้ แสดงว่ามีปัญหา Network Blocking
        updateStatus('liff-status', '🔴 SDK โหลดไม่สำเร็จ', 'red');
        updateStatus('error-message', 'LIFF SDK ถูกบล็อก: ตรวจสอบ Ad Blocker/Network และ Callback URL ใน Console', 'red');
        console.error('LIFF SDK failed to load or is blocked. Check network connection.');
    }
});