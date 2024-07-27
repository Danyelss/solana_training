fn placeholder() {}

fn string_slice(arg: &str) {
    println!("{arg}");
}

fn string(arg: String) {
    println!("{arg}");
}

fn main() {
    string_slice("blue"); // &str

    string("red".to_string()); // String

    string(String::from("hi")); // String

    string("rust is fun!".to_owned()); // String

    string("nice weather".into()); // String

    string(format!("Interpolation {}", "Station")); // String

    // WARNING: This is byte indexing, not character indexing.
    // Character indexing can be done using `s.chars().nth(INDEX)`.
    string_slice(&String::from("abc")[0..1]); // &str

    string_slice("  hello there ".trim()); // &str

    string("Happy Monday!".replace("Mon", "Tues")); // String

    string("mY sHiFt KeY iS sTiCkY".to_lowercase()); // String
}
