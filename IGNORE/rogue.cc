/*
 *  R O G U E   M O R S E L
 *  -----------------------------------------------------------
 *  Arrow keys move, bump to attack, 'q' quits, 'p' quaffs a potion.
 *  Find the Amulet of Yendor (%) and escape through the stairs (>).
 *
 *  Compile: csc /langversion:latest /optimize+ Roguelike.cs
 *  Run:     Roguelike.exe
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

// ------------------------------------------------------------------
//  V E C 2   –   Because System.Numerics is overkill here.
// ------------------------------------------------------------------
struct Vec2 { public int X, Y; public Vec2(int x, int y) { X = x; Y = y; } }

// ------------------------------------------------------------------
//  T I L E   –   What the floor is made of.
// ------------------------------------------------------------------
enum Tile { Wall, Floor, Stairs, Amulet }

// ------------------------------------------------------------------
//  D U N G E O N   –   The map, generation, and field of view.
// ------------------------------------------------------------------
class Dungeon
{
    public int Width, Height;
    public Tile[] Tiles;
    public bool[] Visible;
    public bool[] Explored;
    public Vec2 StairsPos, AmuletPos;
    public List<Vec2> FloorPositions = new List<Vec2>();

    internal Random _rng = new Random();

    public Dungeon(int w, int h)
    {
        Width = w; Height = h;
        Tiles = new Tile[w * h];
        Visible = new bool[w * h];
        Explored = new bool[w * h];
        Generate();
    }

    // --------------------------------------------------------------
    //  G E N E R A T I O N   –   BSP tree → rooms → corridors.
    // --------------------------------------------------------------
    void Generate()
    {
        Array.Fill(Tiles, Tile.Wall);
        var root = new BspNode(1, 1, Width - 2, Height - 2);
        root.Split(_rng, 4);
        root.CreateRooms(this);
        ConnectSiblings(root);
        PlaceStairsAndAmulet();
    }

    void PlaceStairsAndAmulet()
    {
        var rooms = new List<BspNode>();
        GatherRooms(new BspNode(1, 1, Width - 2, Height - 2), rooms);
        if (rooms.Count >= 2)
        {
            StairsPos = rooms[0].RoomCenter();
            AmuletPos = rooms[^1].RoomCenter();
            Tiles[Idx(StairsPos)] = Tile.Stairs;
            Tiles[Idx(AmuletPos)] = Tile.Amulet;
        }
    }

    void GatherRooms(BspNode node, List<BspNode> list)
    {
        if (node.Left == null) { if (node.RoomW > 0) list.Add(node); return; }
        GatherRooms(node.Left, list);
        GatherRooms(node.Right, list);
    }

    void ConnectSiblings(BspNode node)
    {
        if (node.Left == null) return;
        ConnectSiblings(node.Left);
        ConnectSiblings(node.Right);
        CarveCorridor(node.Left.RoomCenter(), node.Right.RoomCenter());
    }

    void CarveCorridor(Vec2 a, Vec2 b)
    {
        int x = a.X, y = a.Y;
        while (x != b.X) { SetFloor(x, y); x += Math.Sign(b.X - x); }
        while (y != b.Y) { SetFloor(x, y); y += Math.Sign(b.Y - y); }
        SetFloor(b.X, b.Y);
    }

    public void SetFloor(int x, int y) { Tiles[y * Width + x] = Tile.Floor; FloorPositions.Add(new Vec2(x, y)); }
    public int Idx(Vec2 p) => p.Y * Width + p.X;
    public Tile At(Vec2 p) => Tiles[Idx(p)];
    public bool IsWalkable(Vec2 p) => At(p) != Tile.Wall;
    public bool InBounds(Vec2 p) => p.X >= 0 && p.X < Width && p.Y >= 0 && p.Y < Height;

    // --------------------------------------------------------------
    //  F I E L D   O F   V I E W   –   Shadowcasting (recursive).
    // --------------------------------------------------------------
    public void ComputeFov(Vec2 origin, int radius)
    {
        Array.Fill(Visible, false);
        Visible[Idx(origin)] = true;
        for (int i = 0; i < 8; i++)
            CastLight(origin, radius, 1, 1.0, 0.0, OctantTransform(i));
    }

    delegate Vec2 Transform(int x, int y);
    Transform OctantTransform(int oct) => oct switch
    {
        0 => (x, y) => new Vec2( x, -y), 1 => (x, y) => new Vec2( y, -x),
        2 => (x, y) => new Vec2( y,  x), 3 => (x, y) => new Vec2( x,  y),
        4 => (x, y) => new Vec2(-x,  y), 5 => (x, y) => new Vec2(-y,  x),
        6 => (x, y) => new Vec2(-y, -x), 7 => (x, y) => new Vec2(-x, -y),
        _ => (x, y) => new Vec2(x, y)
    };

    void CastLight(Vec2 origin, int radius, int row, double startSlope, double endSlope, Transform tx)
    {
        if (startSlope < endSlope) return;
        bool prevBlocked = false;
        for (int dist = row; dist <= radius; dist++)
        {
            int minX = (int)Math.Floor(dist * startSlope);
            int maxX = (int)Math.Ceiling(dist * endSlope);
            for (int x = minX; x <= maxX; x++)
            {
                Vec2 world = tx(x, dist);
                Vec2 pos = new Vec2(origin.X + world.X, origin.Y + world.Y);
                if (!InBounds(pos)) continue;
                if (dist * dist + x * x > radius * radius) continue;

                Visible[Idx(pos)] = true;
                Explored[Idx(pos)] = true;

                bool blocked = At(pos) == Tile.Wall;
                if (prevBlocked && blocked)
                    startSlope = (x + 0.5) / (dist - 0.5);
                else if (!prevBlocked && blocked)
                    CastLight(origin, radius, dist + 1, startSlope, (x - 0.5) / (dist - 0.5), tx);
                prevBlocked = blocked;
            }
            if (prevBlocked) break;
        }
    }

    // --------------------------------------------------------------
    //  B S P   N O D E   –   Recursive space partitioner.
    // --------------------------------------------------------------
    internal class BspNode
    {
        public int X, Y, W, H;
        public BspNode? Left, Right;   // nullable to silence CS8618
        public int RoomX, RoomY, RoomW, RoomH;

        public BspNode(int x, int y, int w, int h) { X = x; Y = y; W = w; H = h; }

        public void Split(Random rng, int minSize)
        {
            if (W < minSize * 2 && H < minSize * 2) return;
            bool splitH = (H > W && H >= minSize * 2) || (W < minSize * 2);
            if (splitH)
            {
                int split = rng.Next(minSize, H - minSize);
                Left = new BspNode(X, Y, W, split);
                Right = new BspNode(X, Y + split, W, H - split);
            }
            else
            {
                int split = rng.Next(minSize, W - minSize);
                Left = new BspNode(X, Y, split, H);
                Right = new BspNode(X + split, Y, W - split, H);
            }
            Left.Split(rng, minSize);
            Right.Split(rng, minSize);
        }

        public void CreateRooms(Dungeon dungeon)
        {
            if (Left != null)
            {
                Left.CreateRooms(dungeon);
                Right!.CreateRooms(dungeon);
                return;
            }

            // Minimum room size is 4x4, so need at least 6 cells in each dimension
            // (room + 1 padding on each side). If node is too small, make a 1x1 "room".
            if (W < 6 || H < 6)
            {
                RoomW = 1;
                RoomH = 1;
                RoomX = X + W / 2;
                RoomY = Y + H / 2;
                dungeon.SetFloor(RoomX, RoomY);
                return;
            }

            RoomW = dungeon._rng.Next(4, W - 2);
            RoomH = dungeon._rng.Next(4, H - 2);
            RoomX = X + dungeon._rng.Next(1, W - RoomW - 1);
            RoomY = Y + dungeon._rng.Next(1, H - RoomH - 1);

            for (int dy = 0; dy < RoomH; dy++)
                for (int dx = 0; dx < RoomW; dx++)
                    dungeon.SetFloor(RoomX + dx, RoomY + dy);
        }

        public Vec2 RoomCenter() => new Vec2(RoomX + RoomW / 2, RoomY + RoomH / 2);
    }
}

// ------------------------------------------------------------------
//  A C T O R   –   Player and monsters share this skeleton.
// ------------------------------------------------------------------
class Actor
{
    public Vec2 Pos;
    public int Hp, MaxHp, Atk;
    public char Symbol;
    public ConsoleColor Color;
    public bool IsPlayer;
    public int Potions = 0;

    public Actor(Vec2 pos, int hp, int atk, char sym, ConsoleColor col, bool player = false)
    { Pos = pos; Hp = MaxHp = hp; Atk = atk; Symbol = sym; Color = col; IsPlayer = player; }

    public void Move(Vec2 delta, Dungeon dungeon, List<Actor> actors)
    {
        Vec2 target = new Vec2(Pos.X + delta.X, Pos.Y + delta.Y);
        if (!dungeon.InBounds(target) || !dungeon.IsWalkable(target)) return;
        Actor? blocker = actors.FirstOrDefault(a => a != this && a.Pos.X == target.X && a.Pos.Y == target.Y && a.Hp > 0);
        if (blocker != null) { Attack(blocker); return; }
        Pos = target;
    }

    void Attack(Actor target)
    {
        int dmg = Math.Max(1, Atk + new Random().Next(-2, 3));
        target.Hp -= dmg;
    }
}

// ------------------------------------------------------------------
//  G A M E   –   The main loop and input handling.
// ------------------------------------------------------------------
class Game
{
    private Dungeon _dungeon = null!;   // initialized in Run()
    private Actor _player = null!;      // initialized in Run()
    private List<Actor> _actors = new List<Actor>();
    private Random _rng = new Random();
    private bool _hasAmulet = false;
    private bool _quit = false;

    public void Run()
    {
        Console.CursorVisible = false;
        Console.Clear();
        _dungeon = new Dungeon(60, 30);
        PlacePlayer();
        SpawnEnemies(6);
        UpdateFov();

        while (!_quit && _player.Hp > 0)
        {
            Render();
            HandleInput();
            if (!_quit) UpdateWorld();
        }
        Console.SetCursorPosition(0, _dungeon.Height + 2);
        Console.WriteLine(_player.Hp <= 0 ? "You died. Press any key." : "Farewell.");
        Console.ReadKey(true);
    }

    void PlacePlayer()
    {
        var start = _dungeon.FloorPositions.OrderBy(_ => _rng.Next()).First();
        _player = new Actor(start, 20, 5, '@', ConsoleColor.Cyan, true) { Potions = 2 };
        _actors.Add(_player);
    }

    void SpawnEnemies(int count)
    {
        char[] glyphs = { 'g', 'o', 'k', 'b', 's' };
        for (int i = 0; i < count; i++)
        {
            Vec2 pos;
            do
            {
                pos = _dungeon.FloorPositions[_rng.Next(_dungeon.FloorPositions.Count)];
            } while (_actors.Any(a => a.Pos.X == pos.X && a.Pos.Y == pos.Y) || Distance(pos, _player.Pos) < 6);
            _actors.Add(new Actor(pos, 8 + _rng.Next(6), 3, glyphs[_rng.Next(glyphs.Length)], ConsoleColor.Red));
        }
    }

    double Distance(Vec2 a, Vec2 b) => Math.Sqrt((a.X - b.X) * (a.X - b.X) + (a.Y - b.Y) * (a.Y - b.Y));

    void UpdateFov() => _dungeon.ComputeFov(_player.Pos, 12);

    void UpdateWorld()
    {
        foreach (var e in _actors.Where(a => !a.IsPlayer && a.Hp > 0))
        {
            if (Distance(e.Pos, _player.Pos) > 15) continue;
            if (_dungeon.Visible[_dungeon.Idx(e.Pos)])
            {
                int dx = Math.Sign(_player.Pos.X - e.Pos.X);
                int dy = Math.Sign(_player.Pos.Y - e.Pos.Y);
                if (dx != 0 && _rng.Next(2) == 0) e.Move(new Vec2(dx, 0), _dungeon, _actors);
                else if (dy != 0) e.Move(new Vec2(0, dy), _dungeon, _actors);
            }
        }
        _actors.RemoveAll(a => a.Hp <= 0 && !a.IsPlayer);
        UpdateFov();

        Tile tile = _dungeon.At(_player.Pos);
        if (tile == Tile.Amulet && !_hasAmulet)
        {
            _hasAmulet = true;
            _dungeon.Tiles[_dungeon.Idx(_player.Pos)] = Tile.Floor;
        }
        if (tile == Tile.Stairs && _hasAmulet) _quit = true;
    }

    void HandleInput()
    {
        if (!Console.KeyAvailable) { Thread.Sleep(30); return; }
        var key = Console.ReadKey(true).Key;
        Vec2 delta = key switch
        {
            ConsoleKey.UpArrow    => new Vec2( 0, -1),
            ConsoleKey.DownArrow  => new Vec2( 0,  1),
            ConsoleKey.LeftArrow  => new Vec2(-1,  0),
            ConsoleKey.RightArrow => new Vec2( 1,  0),
            _ => new Vec2(0, 0)
        };
        if (key == ConsoleKey.Q) _quit = true;
        else if (key == ConsoleKey.P) QuaffPotion();
        else if (delta.X != 0 || delta.Y != 0) _player.Move(delta, _dungeon, _actors);
    }

    void QuaffPotion()
    {
        if (_player.Potions <= 0) return;
        _player.Potions--;
        _player.Hp = Math.Min(_player.MaxHp, _player.Hp + 10);
    }

    void Render()
    {
        Console.SetCursorPosition(0, 0);
        for (int y = 0; y < _dungeon.Height; y++)
        {
            for (int x = 0; x < _dungeon.Width; x++)
            {
                int idx = y * _dungeon.Width + x;
                Actor? actor = _actors.FirstOrDefault(a => a.Pos.X == x && a.Pos.Y == y && a.Hp > 0);
                if (actor != null && _dungeon.Visible[idx])
                {
                    Console.ForegroundColor = actor.Color;
                    Console.Write(actor.Symbol);
                }
                else if (_dungeon.Visible[idx])
                {
                    Console.ForegroundColor = _dungeon.Tiles[idx] switch
                    {
                        Tile.Wall   => ConsoleColor.DarkGray,
                        Tile.Floor  => ConsoleColor.Gray,
                        Tile.Stairs => ConsoleColor.Yellow,
                        Tile.Amulet => ConsoleColor.Magenta,
                        _ => ConsoleColor.White
                    };
                    Console.Write(_dungeon.Tiles[idx] switch
                    {
                        Tile.Wall   => '#',
                        Tile.Stairs => '>',
                        Tile.Amulet => '%',
                        _ => '.'
                    });
                }
                else if (_dungeon.Explored[idx])
                {
                    Console.ForegroundColor = ConsoleColor.DarkGray;
                    Console.Write(_dungeon.Tiles[idx] == Tile.Wall ? '#' : '.');
                }
                else Console.Write(' ');
            }
            Console.WriteLine();
        }
        Console.ForegroundColor = ConsoleColor.White;
        Console.WriteLine($"HP: {_player.Hp}/{_player.MaxHp}  Potions: {_player.Potions}  Amulet: {(_hasAmulet ? "Yes" : "No")}");
        Console.WriteLine("Arrows move, bump to attack, P=drink, Q=quit.");
    }
}

// ------------------------------------------------------------------
//  E N T R Y   –   Where the machine starts chewing.
// ------------------------------------------------------------------
class Program
{
    static void Main()
    {
        Console.OutputEncoding = System.Text.Encoding.UTF8;
        new Game().Run();
    }
}
