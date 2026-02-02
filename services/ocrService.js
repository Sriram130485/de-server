const Tesseract = require('tesseract.js');

const VERIFICATION_STATUS = {
    VERIFIED: 'VERIFIED',
    REVIEW_REQUIRED: 'REVIEW_REQUIRED',
    FAILED: 'FAILED'
};

const verifyDocument = async (imageBuffer, documentType, digilockerData) => {
    try {
        if (!imageBuffer || imageBuffer.length < 100) {
            throw new Error('Image too small or empty');
        }

        // Defensive: Check for basic JPEG/PNG signatures to avoid crashing Tesseract with garbage
        // JPEG starts with FF D8, ends with FF D9
        if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
            if (imageBuffer[imageBuffer.length - 2] !== 0xFF || imageBuffer[imageBuffer.length - 1] !== 0xD9) {
                console.warn("Potential truncated JPEG detected. Tesseract might fail.");
                // We can throw here to be safe and avoid the crash
                throw new Error("Corrupt/Truncated JPEG Image detected");
            }
        }


        // 1. OCR Processing
        const { data: { text: rawText } } = await Tesseract.recognize(imageBuffer, 'eng');

        // console.log(`Backend OCR Raw Text (${documentType}):`, rawText);

        // 2. Extraction
        let extractedData = {};
        if (documentType === 'DL') {
            extractedData = extractDLData(rawText);
        } else if (documentType === 'PAN') {
            extractedData = extractPANData(rawText);
        } else if (documentType === 'AADHAAR') {
            extractedData = extractAadhaarData(rawText);
        } else {
            throw new Error('Invalid document type');
        }

        // console.log('Extracted Data:', extractedData);

        // 3. Comparison
        const comparisonResult = compareData(extractedData, digilockerData, documentType);

        return {
            status: comparisonResult.status,
            reason: comparisonResult.reason,
            ocrData: extractedData
        };

    } catch (error) {
        console.error('Backend OCR Error:', error);
        return {
            status: VERIFICATION_STATUS.FAILED,
            reason: 'OCR Service Failed: ' + error.message,
            ocrData: null
        };
    }
};

// --- Extraction Logic (Ported from Frontend) ---

const extractDLData = (text) => {
    // ... (Existing DL extraction logic) ... 
    const lines = text.split('\n');
    let number = null;
    let name = null;
    let dob = null;

    // 1. Extract DL Number
    // Try to find "License No" or similar first
    const licenseNoLine = lines.find(l => /Licen[cse]\s*No/i.test(l));
    if (licenseNoLine) {
        const parts = licenseNoLine.split(/[:.]/);
        const potentialNum = parts[parts.length - 1].trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (potentialNum.length >= 10) {
            number = potentialNum;
        }
    }

    if (!number) {
        const dlRegex = /([A-Z]{2}[0-9]{2}[\s\-]?[0-9]{4}[\s\-]?[0-9]{7,})|([A-Z]{2}[\s\-]?[0-9]{13,})|([A-Z]{2}[0-9]{2}[\s\-]?[0-9]{11,})/;
        const dlMatch = text.match(dlRegex);
        if (dlMatch) number = dlMatch[0];
    }

    // 2. Extract DOB
    const dobRegex = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/;
    const dobMatch = text.match(dobRegex);
    if (dobMatch) dob = dobMatch[0];
    else if (text.includes('DOB')) {
        const dobLine = lines.find(l => l.includes('DOB') || l.includes('Date of Birth'));
        if (dobLine) {
            const subMatch = dobLine.match(dobRegex);
            if (subMatch) dob = subMatch[0];
        }
    }

    // 3. Extract Name
    const namePrefixRegex = /(Name|S\/O|D\/O|W\/O)[:\s]+([A-Za-z\s]+)/i;
    const nameMatch = text.match(namePrefixRegex);
    if (nameMatch && nameMatch[2]) {
        name = nameMatch[2].trim();
    } else {
        const ignoreWords = ['FORM', 'DRIVING', 'LICENCE', 'O', 'INDIA', 'STATE', 'GOVT', 'TRANSPORT', 'DEPARTMENT', 'VALID', 'ISSUED', 'DOB', 'NO', 'DL'];
        for (let line of lines) {
            const cleanLine = line.trim().toUpperCase().replace(/[^A-Z\s]/g, '');
            // Simplified check: length > 3 and not starting with an ignore word
            if (cleanLine.length > 3) {
                const isIgnored = ignoreWords.some(w => cleanLine.includes(w));
                if (!isIgnored && !name) name = cleanLine;
            }
        }
    }

    return {
        number: number ? cleanString(number) : null,
        name: name ? cleanString(name) : null,
        dob: dob ? normalizeDate(dob) : null
    };
};

const extractPANData = (text) => {
    // ... (Existing PAN extraction logic) ...
    const lines = text.split('\n');
    let number = null;
    let name = null;
    let dob = null;

    // 1. Extract PAN Number
    const panRegex = /([A-Z]{5})[\s\.\-]?[0-9]{4}[\s\.\-]?[A-Z]{1}/;
    const panMatch = text.match(panRegex);
    if (panMatch) number = panMatch[0];

    if (!number) {
        const potentialPan = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/g);
        if (potentialPan && potentialPan.length > 0) number = potentialPan[0];
    }

    const dobRegex = /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/;
    const dobMatch = text.match(dobRegex);
    if (dobMatch) dob = dobMatch[0];

    // Name specific to PAN
    const dobIndex = lines.findIndex(l => dobRegex.test(l));
    if (dobIndex > 0) {
        const potentialNames = lines.slice(0, dobIndex).filter(l => {
            const u = l.toUpperCase();
            return !u.includes('INCOME') && !u.includes('TAX') && !u.includes('DEPARTMENT') && !u.includes('INDIA') && !u.includes('GOVT');
        });
        if (potentialNames.length > 0) {
            name = potentialNames[potentialNames.length - (potentialNames.length >= 2 ? 2 : 1)];
        }
    }
    if (!name) {
        const nameCand = lines.find(l => /^[A-Z\s]+$/.test(l.trim()) && l.length > 4 && !l.includes('TAX'));
        if (nameCand) name = nameCand;
    }

    return {
        number: number ? cleanString(number) : null,
        name: name ? cleanString(name) : null,
        dob: dob ? normalizeDate(dob) : null
    };
};

const extractAadhaarData = (text) => {
    // 1. Try full 12 digits
    const aadhaarRegex = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
    const match = text.match(aadhaarRegex);
    let number = null;
    if (match) {
        number = match[0].replace(/\s/g, '');
    }

    // 2. Try masked format (e.g., XXXX XXXX 1234 or XXXXXXXX1234)
    if (!number) {
        // Look for sequence ending in 4 digits preceded by Xs or generic chars
        // Case: "XXXX XXXX 3036"
        const maskedRegex = /[X\d]{4}\s?[X\d]{4}\s?(\d{4})\b/i;
        const maskedMatch = text.match(maskedRegex);
        if (maskedMatch && maskedMatch[1]) {
            // We return just the last 4 digits as the "number" for comparison logic to handle
            // Or better, return a placeholder with last 4
            number = "XXXXXXXX" + maskedMatch[1];
        }
    }

    return {
        number: number,
        name: null,
        dob: null
    };
};

// --- Helpers ---
const cleanString = (str) => {
    if (!str) return '';
    return str.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
};

const cleanBufferForNumber = (str) => {
    if (!str) return '';
    return str.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const normalizeDate = (dateStr) => {
    return dateStr.replace(/[\/\.]/g, '-');
};

const compareData = (ocrData, digilockerData, documentType) => {
    const { number: ocrNum } = ocrData;
    const { number: userNum } = digilockerData; // renamed to userNum

    // 1. Number Check
    // 1. Number Check
    const cleanedOcrNum = cleanBufferForNumber(ocrNum);
    const cleanedUserNum = cleanBufferForNumber(userNum);

    console.log(`Comparing Numbers (${documentType}) - OCR: '${cleanedOcrNum}', Record: '${cleanedUserNum}'`);

    if (documentType === 'AADHAAR') {
        const last4User = cleanedUserNum.slice(-4);

        // Scenario A: OCR extracted full number
        if (cleanedOcrNum && cleanedOcrNum.length >= 12) {
            const last4Ocr = cleanedOcrNum.slice(-4);
            if (last4Ocr === last4User) {
                return { status: VERIFICATION_STATUS.VERIFIED, reason: 'Matched (Last 4 Digits)' };
            }
        }

        // Scenario B: OCR extracted masked number (e.g. "XXXXXXXX3036")
        if (cleanedOcrNum && cleanedOcrNum.includes('X')) {
            // Extract digits from the end
            const digitsOnly = cleanedOcrNum.replace(/\D/g, ''); // get just numbers
            if (digitsOnly.length >= 4) {
                const last4Ocr = digitsOnly.slice(-4);
                if (last4Ocr === last4User) {
                    return { status: VERIFICATION_STATUS.VERIFIED, reason: 'Matched (Masked Last 4 Digits)' };
                }
            }
        }

        // Scenario C: Partial extract containing just the last 4
        if (cleanedOcrNum && cleanedOcrNum.length === 4 && cleanedOcrNum === last4User) {
            return { status: VERIFICATION_STATUS.VERIFIED, reason: 'Matched (Last 4 Digits Found)' };
        }

        return { status: VERIFICATION_STATUS.FAILED, reason: `Aadhaar ID mismatch (User ends with: ${last4User})` };
    }

    // Default Check (Exact or Partial for DL/PAN)

    // 2. Fail if no number extracted
    if (!cleanedOcrNum) {
        return { status: VERIFICATION_STATUS.FAILED, reason: 'Could not extract document number from image' };
    }

    if (cleanedOcrNum !== cleanedUserNum) {
        // Fuzzy Match Check (Levenshtein Distance)
        // Allow up to 2 character mismatch for DL and PAN
        const distance = levenshteinDistance(cleanedOcrNum, cleanedUserNum);
        if (distance <= 2) {
            console.log(`Fuzzy match successful. Distance: ${distance}`);
            return { status: VERIFICATION_STATUS.VERIFIED, reason: `Matched (Fuzzy, Dist: ${distance})` };
        }

        // Relaxed Check for DL
        if (documentType === 'DL') {
            // Check for partial match if one string is a substring of the other
            // Also ensure the match is substantial (at least 6 chars) to avoid matching "AP" to "AP..." wrongly
            if ((cleanedOcrNum.includes(cleanedUserNum) || cleanedUserNum.includes(cleanedOcrNum)) &&
                Math.min(cleanedOcrNum.length, cleanedUserNum.length) > 6) {
                console.log("Allowing partial match due to potential extra characters.");
                return { status: VERIFICATION_STATUS.VERIFIED, reason: 'Matched (Partial Number)' };
            }
        }

        return { status: VERIFICATION_STATUS.FAILED, reason: `Document number mismatch (OCR: ${cleanedOcrNum}, Rec: ${cleanedUserNum})` };
    }

    return { status: VERIFICATION_STATUS.VERIFIED, reason: 'Matched (Number Only)' };
};

const calculateSimilarity = (s1, s2) => {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    const longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    const editDistance = levenshteinDistance(longer, shorter);
    return Math.round(((longerLength - editDistance) / parseFloat(longerLength)) * 100);
};

const levenshteinDistance = (s1, s2) => {
    s1 = s1.toLowerCase(); s2 = s2.toLowerCase();
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
};

module.exports = { verifyDocument, VERIFICATION_STATUS };
