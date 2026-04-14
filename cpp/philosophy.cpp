#include <iostream>
#include <string>
#include <vector>
#include <random>

int main() {
    std::vector<std::string> lain = {
        "What if we made a website at 2 AM?",
        "But like, no filters. Just vibes.",
        "We could call it Twin Pears.",
        "Because pears are underrated.",
        "And two is better than one."
    };

    std::vector<std::string> aaliyah = {
        "You're delulu.",
        "...I'm in.",
        "Can we use Deepseek for the CSS?",
        "ChatGPT can write the boring parts.",
        "We'll just debug later."
    };

    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dist(0, 4);

    std::cout << "\n   [ 2:00 AM – Dumb vs. Dumb ]\n\n";
    for (int i = 0; i < 5; ++i) {
        std::cout << "Lain:     " << lain[dist(gen)] << '\n';
        std::cout << "Aaliyah:  " << aaliyah[dist(gen)] << "\n\n";
    }

    std::cout << "* Twin Pears v1.0 was born *\n";
    return 0;
}