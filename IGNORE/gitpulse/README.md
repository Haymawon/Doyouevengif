# GitPulse

Visual heartbeat of a Git repository.  
Run it inside any repo to see commit frequency and top contributors.

## Install

```
bundle install
```

## Usage
```
./bin/gitpulse [--days N] [--width W] [--authors A]
```
## Example Output
```
GitPulse – last 90 days
Repository: my_project

Commits per day (max 12):
▁▂▃▅▇█▆▄▂▁▁▂▄▆███▇▅▃▂▁

Total commits: 247
Average per day: 2.74

Top 5 authors:
  alice               ██████████████████████████████ 89
  bob                 ████████████████ 48
  carol               ██████████ 31
  dave                ██████ 18
  eve                 ███ 9
```
