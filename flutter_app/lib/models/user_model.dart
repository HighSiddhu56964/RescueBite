class UserModel {
  final String id;
  final String name;
  final String? username;
  final int? age;
  final String? gender;
  final String? phone;
  final String? grNumber;
  final String role; // 'user' or 'authority'

  UserModel({
    required this.id,
    required this.name,
    this.username,
    this.age,
    this.gender,
    this.phone,
    this.grNumber,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'].toString(),
      name: json['name'],
      username: json['username'],
      age: json['age'],
      gender: json['gender'],
      phone: json['phone'],
      grNumber: json['grNumber'],
      role: json['role'] ?? 'user',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'age': age,
      'gender': gender,
      'phone': phone,
      'grNumber': grNumber,
      'role': role,
    };
  }
}
