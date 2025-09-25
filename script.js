// LIFF ID ของคุณ (2008162847-jMMzgOn1)
const liffId = '2008162847-jMMzgOn1';
let myUserId = '';

// URL ของ Backend API ของคุณ
const apiBaseUrl = 'https://website-degree-bn.onrender.com';
//const apiBaseUrl = 'http://localhost:5000';

// อัปเดตสถานะในหน้าเว็บ
function updateStatus(elementId, message, color = 'black') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.color = color;
    }
}

// ฟังก์ชันหลัก: เริ่มต้น LIFF และล็อกอิน
async function initializeLiff() {
    try {
        console.log('Initializing LIFF with ID:', liffId);
        
        // 1. เริ่มต้น LIFF
        await liff.init({ liffId: liffId });
        console.log('LIFF initialized successfully');

        // 2. ตรวจสอบสถานะการล็อกอิน
        if (!liff.isLoggedIn()) {
            console.log('User not logged in, redirecting to login...');
            liff.login();
        } else {
            console.log('User is logged in, getting profile...');
            
            // 3. ดึง Profile
            const profile = await liff.getProfile();
            myUserId = profile.userId;
            console.log(`Logged in with userId: ${myUserId}`);
            
            // 4. แสดงข้อมูลผู้ใช้
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('user-name').textContent = profile.displayName;
            document.getElementById('user-id-display').textContent = myUserId;
            
            // 5. แสดงฟอร์มลงทะเบียน
            document.getElementById('registrationForm').style.display = 'block';
            document.getElementById('login-message').style.display = 'none';
            
            // 6. ดึงรายชื่อแขกที่เคยลงทะเบียน
            fetchMyGuests();
        }
    } catch (err) {
        console.error('LIFF initialization failed', err);
        document.getElementById('login-message').innerHTML = '<p>❌ เกิดข้อผิดพลาดในการล็อกอิน กรุณาลองใหม่</p>';
    }
}

// ฟังก์ชันสำหรับส่งข้อมูลการลงทะเบียน
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const guestData = {
        line_user_id: myUserId,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        date_of_birth: formData.get('dob'),
        phone: formData.get('phone'),
        visit_date: formData.get('visitDate'),
    };

    try {
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(guestData)
        });

        if (response.ok) {
            alert('ลงทะเบียนสำเร็จ!');
            document.getElementById('registrationForm').reset();
            fetchMyGuests(); // อัปเดตรายชื่อ
        } else {
            alert('เกิดข้อผิดพลาดในการลงทะเบียน');
        }
    } catch (error) {
        console.error('Error submitting data:', error);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
});

// ฟังก์ชันสำหรับดึงรายชื่อแขกที่ลงทะเบียนโดยผู้ใช้ปัจจุบัน
async function fetchMyGuests() {
    try {
        const response = await fetch(`${apiBaseUrl}/guests?userId=${myUserId}`);
        const guests = await response.json();
        const guestListElement = document.getElementById('guestList');
        guestListElement.innerHTML = '';
        guests.forEach(guest => {
            const listItem = document.createElement('li');
            listItem.className = 'guest-item';
            listItem.innerHTML = `
                <span>${guest.first_name} ${guest.last_name} (${guest.visit_date})</span>
                ${guest.phone ? `<small style="display: block; color: #666;">📞 ${guest.phone}</small>` : ''}
                <button class="delete-btn" onclick="deleteGuest('${guest.id}')">ลบ</button>
            `;
            guestListElement.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching guests:', error);
    }
}

// ฟังก์ชันสำหรับลบข้อมูล
async function deleteGuest(guestId) {
    if (confirm('คุณต้องการลบรายชื่อนี้ใช่ไหม?')) {
        try {
            const response = await fetch(`${apiBaseUrl}/guest/${guestId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('ลบรายชื่อสำเร็จ!');
                fetchMyGuests(); // อัปเดตรายชื่อ
            } else {
                alert('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        } catch (error) {
            console.error('Error deleting guest:', error);
        }
    }
}

// ฟังก์ชันสำหรับดูรายชื่อแขกทั้งหมดในแต่ละวัน
async function viewAllGuests(date) {
    try {
        const response = await fetch(`${apiBaseUrl}/guests/day/${date}`);
        const guests = await response.json();
        const allGuestsListElement = document.getElementById('allGuestsList');
        allGuestsListElement.innerHTML = '';
        
        if (guests.length === 0) {
            allGuestsListElement.innerHTML = '<li class="guest-item">ยังไม่มีผู้ลงทะเบียนในวันนี้</li>';
            return;
        }

        guests.forEach(guest => {
            const listItem = document.createElement('li');
            listItem.className = 'guest-item';
            listItem.innerHTML = `
                <span>${guest.first_name} ${guest.last_name}</span>
                ${guest.phone ? `<small style="display: block; color: #666;">📞 ${guest.phone}</small>` : ''}
            `;
            allGuestsListElement.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching all guests:', error);
    }
}

// รอให้ DOM โหลดเสร็จก่อนเรียก initializeLiff()
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing LIFF...');
    
    // ตรวจสอบว่า LIFF SDK โหลดแล้วหรือยัง
    if (typeof liff !== 'undefined') {
        console.log('LIFF SDK found, initializing...');
        initializeLiff();
    } else {
        console.log('LIFF SDK not found, waiting...');
        // รอสักครู่แล้วลองใหม่
        setTimeout(() => {
            if (typeof liff !== 'undefined') {
                console.log('LIFF SDK loaded after delay, initializing...');
                initializeLiff();
            } else {
                console.log('LIFF SDK not available');
                document.getElementById('login-message').innerHTML = '<p>❌ ไม่สามารถโหลด LIFF SDK ได้ กรุณาเปิดใน LINE app</p>';
            }
        }, 2000);
    }
});