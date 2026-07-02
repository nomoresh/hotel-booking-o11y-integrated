export type Hotel = {
  id: string
  name: string
  nameEn: string
  city: string
  area: string
  image: string
  gallery: string[]
  rating: number
  reviews: number
  price: number
  originalPrice?: number
  tags: string[]
  amenities: string[]
  description: string
  badge?: "특가" | "인기" | "신규"
}

export const HOTELS: Hotel[] = [
  {
    id: "seaside-jeju",
    name: "시사이드 오션 리조트",
    nameEn: "Seaside Ocean Resort",
    city: "제주",
    area: "중문 · 오션뷰",
    image: "/images/hero-resort.png",
    gallery: ["/images/hero-resort.png", "/images/hotel-2.png", "/images/hotel-4.png"],
    rating: 4.8,
    reviews: 2841,
    price: 189000,
    originalPrice: 298000,
    tags: ["오션뷰", "인피니티 풀", "조식포함"],
    amenities: ["무료 Wi-Fi", "수영장", "스파", "주차", "레스토랑", "피트니스"],
    description:
      "중문 해변을 마주한 인피니티 풀과 프라이빗 오션뷰 객실. 석양이 아름다운 프리미엄 리조트입니다.",
    badge: "특가",
  },
  {
    id: "urban-seoul",
    name: "어반 스카이 호텔",
    nameEn: "Urban Sky Hotel",
    city: "서울",
    area: "강남 · 도심",
    image: "/images/hotel-1.png",
    gallery: ["/images/hotel-1.png", "/images/hotel-2.png"],
    rating: 4.6,
    reviews: 1932,
    price: 142000,
    originalPrice: 175000,
    tags: ["시티뷰", "역세권", "루프탑 바"],
    amenities: ["무료 Wi-Fi", "루프탑 바", "피트니스", "비즈니스 라운지", "주차"],
    description:
      "강남 중심부, 지하철역 도보 3분. 야경이 멋진 루프탑 바와 넓은 비즈니스 라운지를 갖춘 도심형 호텔.",
    badge: "인기",
  },
  {
    id: "hanok-jeonju",
    name: "고요 한옥 스테이",
    nameEn: "Goyo Hanok Stay",
    city: "전주",
    area: "한옥마을",
    image: "/images/hotel-3.png",
    gallery: ["/images/hotel-3.png", "/images/hotel-2.png"],
    rating: 4.9,
    reviews: 864,
    price: 168000,
    tags: ["한옥", "프라이빗 마당", "전통조식"],
    amenities: ["무료 Wi-Fi", "전통 조식", "마당", "온돌", "주차"],
    description:
      "전주 한옥마을 한가운데, 프라이빗 마당을 품은 전통 한옥. 따뜻한 온돌과 정갈한 조식이 준비됩니다.",
    badge: "신규",
  },
  {
    id: "mountain-gangwon",
    name: "마운틴 스파 리트릿",
    nameEn: "Mountain Spa Retreat",
    city: "강원",
    area: "평창 · 스키인아웃",
    image: "/images/hotel-4.png",
    gallery: ["/images/hotel-4.png", "/images/hotel-2.png"],
    rating: 4.7,
    reviews: 1523,
    price: 215000,
    originalPrice: 260000,
    tags: ["온천", "스키인아웃", "마운틴뷰"],
    amenities: ["무료 Wi-Fi", "노천 온천", "스파", "스키 대여", "레스토랑", "주차"],
    description:
      "설산 전망의 노천 온천과 스키인아웃 접근성. 겨울 여행에 최적화된 프리미엄 마운틴 리조트.",
    badge: "특가",
  },
  {
    id: "boutique-busan",
    name: "웨이브 부티크 호텔",
    nameEn: "Wave Boutique Hotel",
    city: "부산",
    area: "해운대 · 오션뷰",
    image: "/images/hotel-2.png",
    gallery: ["/images/hotel-2.png", "/images/hero-resort.png"],
    rating: 4.5,
    reviews: 2104,
    price: 128000,
    originalPrice: 159000,
    tags: ["오션뷰", "해변앞", "감성인테리어"],
    amenities: ["무료 Wi-Fi", "오션뷰 라운지", "카페", "자전거 대여"],
    description:
      "해운대 해변 바로 앞, 스칸디나비안 감성 인테리어의 부티크 호텔. 통유리 너머로 바다가 펼쳐집니다.",
    badge: "인기",
  },
  {
    id: "city-incheon",
    name: "에어포트 트랜짓 스테이",
    nameEn: "Airport Transit Stay",
    city: "인천",
    area: "공항 인근",
    image: "/images/hotel-1.png",
    gallery: ["/images/hotel-1.png"],
    rating: 4.3,
    reviews: 987,
    price: 98000,
    tags: ["공항셔틀", "24시 체크인", "방음"],
    amenities: ["무료 Wi-Fi", "공항 셔틀", "24시간 프론트", "주차"],
    description:
      "인천공항 무료 셔틀 운행. 이른 출국·늦은 입국 여행객을 위한 방음 설계의 트랜짓 호텔.",
  },
]

export function getHotel(id: string) {
  return HOTELS.find((h) => h.id === id)
}

export function formatKRW(value: number) {
  return "₩" + value.toLocaleString("ko-KR")
}
