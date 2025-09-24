// เปลี่ยน LIFF ID ตรงนี้เป็น LIFF ID ของคุณ
const liffId = '2008162847-jMMzgOn1';
let myUserId = '';

// URL ของ Backend API ของคุณ
const apiBaseUrl = 'https://website-degree-bn.onrender.com';
//const apiBaseUrl = 'http://localhost:5000'; 

// ฟังก์ชันเริ่มต้น LIFF
async function initializeLiff() {
    try {
        console.log('Initializing LIFF with ID:', liffId);
        await liff.init({ liffId: liffId });
        console.log('LIFF initialized successfully');
        
        // ตรวจสอบสถานะการล็อกอิน
        console.log('Checking login status...');
        if (!liff.isLoggedIn()) {
            console.log('User not logged in, redirecting to login...');
            liff.login();
        } else {
            console.log('User is logged in, getting profile...');
            const profile = await liff.getProfile();
            myUserId = profile.userId;
            console.log(`Logged in with userId: ${myUserId}`);
            
            // แสดงรูปโปรไฟล์และชื่อผู้ใช้
            document.getElementById('profile-container').style.display = 'block';
            document.getElementById('profile-picture').src = profile.pictureUrl;
            document.getElementById('display-name').textContent = profile.displayName;

            fetchMyGuests(); // ดึงรายชื่อแขกที่เคยลงทะเบียน
        }
    } catch (err) {
        console.error('LIFF initialization failed', err);
        alert('เกิดข้อผิดพลาดในการเริ่มต้น LIFF โปรดลองเปิดเว็บไซต์นี้จากแอปพลิเคชัน LINE');
    }
}

// ฟังก์ชันสำหรับส่งข้อมูลการลงทะเบียน
document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // ตรวจสอบว่าได้ userId จาก LIFF แล้ว
    if (!myUserId) {
        alert('ไม่สามารถลงทะเบียนได้ โปรดล็อกอินผ่าน LINE App ก่อน');
        return;
    }
    const formData = new FormData(e.target);
    const guestData = {
        line_user_id: myUserId,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        gender: formData.get('gender'),
        date_of_birth: formData.get('dob'),
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
            const errorData = await response.json();
            alert(`เกิดข้อผิดพลาดในการลงทะเบียน: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error submitting data:', error);
        alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
});

// ฟังก์ชันสำหรับดึงรายชื่อแขกที่ลงทะเบียนโดยผู้ใช้ปัจจุบัน
async function fetchMyGuests() {
    // ตรวจสอบว่าได้ userId จาก LIFF แล้ว
    if (!myUserId || myUserId === 'test-user') {
        return;
    }

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
                const errorData = await response.json();
                alert(`เกิดข้อผิดพลาดในการลบ: ${errorData.error}`);
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
            listItem.textContent = `${guest.first_name} ${guest.last_name} (${guest.gender})`;
            allGuestsListElement.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching all guests:', error);
    }
}

// เริ่มต้น LIFF เมื่อหน้าเว็บโหลดเสร็จ
window.addEventListener('load', () => {
    console.log('Page loaded, initializing LIFF...');
    initializeLiff();
});